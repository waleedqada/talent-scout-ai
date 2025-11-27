-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can view resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  years_of_experience INTEGER,
  education TEXT,
  summary TEXT,
  resume_url TEXT,
  resume_filename TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT,
  proficiency_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work experiences table
CREATE TABLE IF NOT EXISTS public.work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job requirements table
CREATE TABLE IF NOT EXISTS public.job_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  required_skills TEXT[] NOT NULL,
  required_experience_years INTEGER,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate rankings table
CREATE TABLE IF NOT EXISTS public.candidate_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_requirement_id UUID REFERENCES public.job_requirements(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  matched_skills TEXT[],
  missing_skills TEXT[],
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id, job_requirement_id)
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view all candidates"
ON public.candidates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert candidates"
ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
ON public.candidates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete candidates"
ON public.candidates FOR DELETE TO authenticated USING (true);

-- Skills policies
CREATE POLICY "Authenticated users can view all skills"
ON public.candidate_skills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert skills"
ON public.candidate_skills FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update skills"
ON public.candidate_skills FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete skills"
ON public.candidate_skills FOR DELETE TO authenticated USING (true);

-- Work experiences policies
CREATE POLICY "Authenticated users can view all experiences"
ON public.work_experiences FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert experiences"
ON public.work_experiences FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update experiences"
ON public.work_experiences FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete experiences"
ON public.work_experiences FOR DELETE TO authenticated USING (true);

-- Job requirements policies
CREATE POLICY "Authenticated users can view all job requirements"
ON public.job_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert job requirements"
ON public.job_requirements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update job requirements"
ON public.job_requirements FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete job requirements"
ON public.job_requirements FOR DELETE TO authenticated USING (true);

-- Rankings policies
CREATE POLICY "Authenticated users can view all rankings"
ON public.candidate_rankings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert rankings"
ON public.candidate_rankings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update rankings"
ON public.candidate_rankings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete rankings"
ON public.candidate_rankings FOR DELETE TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_requirements_updated_at BEFORE UPDATE ON public.job_requirements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();