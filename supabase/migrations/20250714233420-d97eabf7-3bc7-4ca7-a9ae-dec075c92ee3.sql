-- Create CRM core data models for GoHighLevel-style functionality

-- Lead Sources for attribution tracking
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  tracking_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads Management
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT NOT NULL DEFAULT 'new',
  lead_source_id UUID REFERENCES public.lead_sources(id),
  assigned_to UUID,
  qualification_status TEXT DEFAULT 'unqualified',
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead Activities for interaction tracking
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales Pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  probability DECIMAL(5,2) DEFAULT 0,
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deals/Opportunities
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id),
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  assigned_to UUID NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  probability DECIMAL(5,2) DEFAULT 0,
  expected_close_date DATE,
  actual_close_date DATE,
  deal_status TEXT DEFAULT 'open',
  lost_reason TEXT,
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deal Activities
CREATE TABLE IF NOT EXISTS public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend existing contacts table with custom fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned ON public.deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_value ON public.deals(value DESC);

-- Enable RLS on new tables
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view active lead sources" ON public.lead_sources FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage lead sources" ON public.lead_sources FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their assigned leads" ON public.leads FOR SELECT USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can update their assigned leads" ON public.leads FOR UPDATE USING (auth.uid() = assigned_to OR is_admin(auth.uid()));

CREATE POLICY "Users can view active pipelines" ON public.pipelines FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pipelines" ON public.pipelines FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view pipeline stages" ON public.pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Admins can manage pipeline stages" ON public.pipeline_stages FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their assigned deals" ON public.deals FOR SELECT USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can update their assigned deals" ON public.deals FOR UPDATE USING (auth.uid() = assigned_to OR is_admin(auth.uid()));

-- Insert default data
INSERT INTO public.lead_sources (name, description, source_type) VALUES 
('Website Form', 'Leads from website contact forms', 'website'),
('Social Media', 'Leads from social media platforms', 'social'),
('Referral', 'Leads from customer referrals', 'referral'),
('Cold Outreach', 'Leads from cold email/calling', 'manual'),
('Advertisement', 'Leads from paid advertising', 'ads')
ON CONFLICT DO NOTHING;

INSERT INTO public.pipelines (name, description, is_default, created_by) VALUES 
('Sales Pipeline', 'Default sales pipeline for all deals', true, '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Insert pipeline stages with correct syntax
DO $$
DECLARE
    pipeline_id UUID;
BEGIN
    SELECT id INTO pipeline_id FROM public.pipelines WHERE is_default = true LIMIT 1;
    
    IF pipeline_id IS NOT NULL THEN
        INSERT INTO public.pipeline_stages (pipeline_id, name, description, stage_order, probability, is_closed_won, is_closed_lost) VALUES
        (pipeline_id, 'Lead', 'Initial lead stage', 1, 10, false, false),
        (pipeline_id, 'Qualified', 'Qualified prospect', 2, 25, false, false),
        (pipeline_id, 'Proposal', 'Proposal sent', 3, 50, false, false),
        (pipeline_id, 'Negotiation', 'In negotiation', 4, 75, false, false),
        (pipeline_id, 'Closed Won', 'Deal won', 5, 100, true, false),
        (pipeline_id, 'Closed Lost', 'Deal lost', 6, 0, false, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;