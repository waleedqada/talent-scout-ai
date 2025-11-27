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
    const { resumeUrl, candidateId } = await req.json();
    
    if (!resumeUrl) {
      throw new Error('Resume URL is required');
    }

    console.log('Analyzing resume:', resumeUrl);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the resume file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('resumes')
      .download(resumeUrl.replace('resumes/', ''));

    if (downloadError) {
      console.error('Error downloading resume:', downloadError);
      throw new Error(`Failed to download resume: ${downloadError.message}`);
    }

    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Sending to AI for analysis...');

    // Call Lovable AI to analyze the resume
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
            content: `You are an expert resume parser. Extract structured information from resumes in Arabic and English.
            Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
            {
              "full_name": "string",
              "email": "string or null",
              "phone": "string or null",
              "location": "string or null",
              "years_of_experience": number or null,
              "education": "string",
              "summary": "brief professional summary",
              "skills": [{"skill_name": "string", "skill_category": "Technical/Soft/Language/Other", "proficiency_level": "Beginner/Intermediate/Advanced/Expert"}],
              "work_experiences": [{"company_name": "string", "position": "string", "start_date": "string", "end_date": "string or Present", "description": "string"}]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this resume and extract all relevant information. Return only the JSON object.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    let analysisResult;
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanedContent);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      throw new Error(`Failed to parse AI response: ${errorMessage}`);
    }

    // Update candidate with extracted information
    if (candidateId) {
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          full_name: analysisResult.full_name || 'Unknown',
          email: analysisResult.email,
          phone: analysisResult.phone,
          location: analysisResult.location,
          years_of_experience: analysisResult.years_of_experience,
          education: analysisResult.education,
          summary: analysisResult.summary,
          status: 'analyzed',
        })
        .eq('id', candidateId);

      if (updateError) {
        console.error('Error updating candidate:', updateError);
        throw updateError;
      }

      // Insert skills
      if (analysisResult.skills && analysisResult.skills.length > 0) {
        const skillsToInsert = analysisResult.skills.map((skill: any) => ({
          candidate_id: candidateId,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category || 'Other',
          proficiency_level: skill.proficiency_level || 'Intermediate',
        }));

        const { error: skillsError } = await supabase
          .from('candidate_skills')
          .insert(skillsToInsert);

        if (skillsError) {
          console.error('Error inserting skills:', skillsError);
        }
      }

      // Insert work experiences
      if (analysisResult.work_experiences && analysisResult.work_experiences.length > 0) {
        const experiencesToInsert = analysisResult.work_experiences.map((exp: any) => ({
          candidate_id: candidateId,
          company_name: exp.company_name,
          position: exp.position,
          start_date: exp.start_date,
          end_date: exp.end_date,
          description: exp.description,
        }));

        const { error: expError } = await supabase
          .from('work_experiences')
          .insert(experiencesToInsert);

        if (expError) {
          console.error('Error inserting experiences:', expError);
        }
      }
    }

    console.log('Analysis complete');

    return new Response(
      JSON.stringify({ success: true, data: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-resume function:', error);
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