import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRequirementId, candidateIds } = await req.json();
    
    if (!jobRequirementId) {
      throw new Error('Job requirement ID is required');
    }

    console.log('Ranking candidates for job:', jobRequirementId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get job requirements
    const { data: jobReq, error: jobError } = await supabase
      .from('job_requirements')
      .select('*')
      .eq('id', jobRequirementId)
      .single();

    if (jobError || !jobReq) {
      throw new Error('Job requirement not found');
    }

    // Get candidates to rank
    let candidatesQuery = supabase
      .from('candidates')
      .select(`
        *,
        candidate_skills(*),
        work_experiences(*)
      `)
      .eq('status', 'analyzed');

    if (candidateIds && candidateIds.length > 0) {
      candidatesQuery = candidatesQuery.in('id', candidateIds);
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery;

    if (candidatesError) {
      throw candidatesError;
    }

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No analyzed candidates found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Ranking ${candidates.length} candidates...`);

    // Process each candidate
    const rankings = [];
    
    for (const candidate of candidates) {
      const candidateSkills = candidate.candidate_skills?.map((s: any) => s.skill_name) || [];
      const requiredSkills = jobReq.required_skills || [];

      // Calculate basic match
      const matchedSkills = candidateSkills.filter((skill: string) => 
        requiredSkills.some((req: string) => 
          skill.toLowerCase().includes(req.toLowerCase()) || 
          req.toLowerCase().includes(skill.toLowerCase())
        )
      );

      const missingSkills = requiredSkills.filter((req: string) => 
        !candidateSkills.some((skill: string) => 
          skill.toLowerCase().includes(req.toLowerCase()) || 
          req.toLowerCase().includes(skill.toLowerCase())
        )
      );

      // Calculate score (0-100)
      let score = 0;
      
      // Skills match (60% weight)
      if (requiredSkills.length > 0) {
        score += (matchedSkills.length / requiredSkills.length) * 60;
      }

      // Experience match (40% weight)
      if (jobReq.required_experience_years && candidate.years_of_experience) {
        const expDiff = Math.abs(candidate.years_of_experience - jobReq.required_experience_years);
        const expScore = Math.max(0, 40 - (expDiff * 5));
        score += expScore;
      } else if (!jobReq.required_experience_years) {
        score += 40; // No experience requirement
      }

      // Get AI recommendation
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an expert recruitment consultant. Provide a brief, actionable recommendation for this candidate match.'
            },
            {
              role: 'user',
              content: `Job: ${jobReq.job_title}
Required Skills: ${requiredSkills.join(', ')}
Required Experience: ${jobReq.required_experience_years || 'Not specified'} years

Candidate: ${candidate.full_name}
Skills: ${candidateSkills.join(', ')}
Experience: ${candidate.years_of_experience || 'Not specified'} years
Matched Skills: ${matchedSkills.join(', ')}
Missing Skills: ${missingSkills.join(', ')}

Provide a 2-3 sentence recommendation in Arabic or English based on the resume language.`
            }
          ],
          temperature: 0.7,
        }),
      });

      let recommendation = 'يرجى مراجعة الملف الشخصي بعناية';
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        recommendation = aiData.choices?.[0]?.message?.content || recommendation;
      }

      rankings.push({
        candidate_id: candidate.id,
        job_requirement_id: jobRequirementId,
        match_score: Math.round(score),
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        recommendation,
      });
    }

    // Insert or update rankings
    for (const ranking of rankings) {
      const { error: rankError } = await supabase
        .from('candidate_rankings')
        .upsert(ranking, {
          onConflict: 'candidate_id,job_requirement_id'
        });

      if (rankError) {
        console.error('Error upserting ranking:', rankError);
      }
    }

    console.log('Ranking complete');

    return new Response(
      JSON.stringify({ success: true, rankings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rank-candidates function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});