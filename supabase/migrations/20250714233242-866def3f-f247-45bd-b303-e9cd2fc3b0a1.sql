-- Create CRM core data models for GoHighLevel-style functionality

-- Lead Sources for attribution tracking
CREATE TABLE public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual', -- manual, website, social, referral, ads, etc.
  tracking_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads Management
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT NOT NULL DEFAULT 'new', -- new, qualified, contacted, converted, lost
  lead_source_id UUID REFERENCES public.lead_sources(id),
  assigned_to UUID, -- user who owns this lead
  qualification_status TEXT DEFAULT 'unqualified', -- unqualified, marketing_qualified, sales_qualified
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead Activities for interaction tracking
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- email_sent, email_opened, call_made, meeting_scheduled, etc.
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  performed_by UUID, -- user who performed the activity
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales Pipelines
CREATE TABLE public.pipelines (
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
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  probability DECIMAL(5,2) DEFAULT 0, -- conversion probability %
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deals/Opportunities
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id),
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  assigned_to UUID NOT NULL, -- sales rep
  value DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  probability DECIMAL(5,2) DEFAULT 0,
  expected_close_date DATE,
  actual_close_date DATE,
  deal_status TEXT DEFAULT 'open', -- open, won, lost
  lost_reason TEXT,
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deal Activities
CREATE TABLE public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact Tags for categorization
CREATE TABLE public.contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, tag)
);

-- Contact Notes for relationship tracking
CREATE TABLE public.contact_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- general, call, meeting, email, etc.
  created_by UUID NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Campaigns
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id),
  campaign_type TEXT DEFAULT 'broadcast', -- broadcast, drip, automation
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent, paused
  send_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  target_audience JSONB DEFAULT '{}', -- criteria for who receives it
  custom_fields JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SMS Campaigns
CREATE TABLE public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message_content TEXT NOT NULL,
  campaign_type TEXT DEFAULT 'broadcast',
  status TEXT DEFAULT 'draft',
  send_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  target_audience JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversation Threads for unified communications
CREATE TABLE public.conversation_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  subject TEXT,
  channel TEXT NOT NULL, -- email, sms, chat, social
  status TEXT DEFAULT 'active', -- active, closed, archived
  assigned_to UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflows for automation
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- form_submission, email_opened, tag_added, etc.
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Actions
CREATE TABLE public.workflow_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- send_email, send_sms, add_tag, create_task, etc.
  action_config JSONB DEFAULT '{}',
  delay_minutes INTEGER DEFAULT 0,
  action_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Executions for tracking
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id),
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  trigger_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'running', -- running, completed, failed, cancelled
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  assigned_to UUID NOT NULL, -- staff member
  appointment_type TEXT DEFAULT 'meeting',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  meeting_url TEXT, -- for video calls
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed, no_show
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar Settings
CREATE TABLE public.calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
  buffer_time INTEGER DEFAULT 15, -- minutes between appointments
  advance_booking_days INTEGER DEFAULT 30,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- CRM Analytics
CREATE TABLE public.crm_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_type TEXT NOT NULL, -- count, percentage, currency, etc.
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID, -- if user-specific
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend existing contacts table with custom fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX idx_leads_score ON public.leads(lead_score DESC);
CREATE INDEX idx_deals_pipeline ON public.deals(pipeline_id);
CREATE INDEX idx_deals_stage ON public.deals(stage_id);
CREATE INDEX idx_deals_assigned ON public.deals(assigned_to);
CREATE INDEX idx_deals_value ON public.deals(value DESC);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX idx_deal_activities_deal ON public.deal_activities(deal_id);
CREATE INDEX idx_conversation_threads_contact ON public.conversation_threads(contact_id);
CREATE INDEX idx_appointments_user ON public.appointments(assigned_to);
CREATE INDEX idx_appointments_date ON public.appointments(start_time);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON public.contact_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON public.sms_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversation_threads_updated_at BEFORE UPDATE ON public.conversation_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_settings_updated_at BEFORE UPDATE ON public.calendar_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all new tables
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Lead Sources policies
CREATE POLICY "Anyone can view active lead sources" ON public.lead_sources FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage lead sources" ON public.lead_sources FOR ALL USING (is_admin(auth.uid()));

-- Leads policies
CREATE POLICY "Users can view leads assigned to them" ON public.leads FOR SELECT USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can update their assigned leads" ON public.leads FOR UPDATE USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all leads" ON public.leads FOR ALL USING (is_admin(auth.uid()));

-- Lead Activities policies
CREATE POLICY "Users can view activities for their leads" ON public.lead_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_activities.lead_id AND (leads.assigned_to = auth.uid() OR is_admin(auth.uid())))
);
CREATE POLICY "Users can create activities for their leads" ON public.lead_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_activities.lead_id AND (leads.assigned_to = auth.uid() OR is_admin(auth.uid())))
);

-- Pipelines policies
CREATE POLICY "Users can view active pipelines" ON public.pipelines FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pipelines" ON public.pipelines FOR ALL USING (is_admin(auth.uid()));

-- Pipeline Stages policies
CREATE POLICY "Users can view pipeline stages" ON public.pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Admins can manage pipeline stages" ON public.pipeline_stages FOR ALL USING (is_admin(auth.uid()));

-- Deals policies
CREATE POLICY "Users can view deals assigned to them" ON public.deals FOR SELECT USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can update their assigned deals" ON public.deals FOR UPDATE USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all deals" ON public.deals FOR ALL USING (is_admin(auth.uid()));

-- Deal Activities policies
CREATE POLICY "Users can view activities for their deals" ON public.deal_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_activities.deal_id AND (deals.assigned_to = auth.uid() OR is_admin(auth.uid())))
);
CREATE POLICY "Users can create activities for their deals" ON public.deal_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_activities.deal_id AND (deals.assigned_to = auth.uid() OR is_admin(auth.uid())))
);

-- Contact Tags policies
CREATE POLICY "Users can view contact tags" ON public.contact_tags FOR SELECT USING (true);
CREATE POLICY "Users can manage contact tags" ON public.contact_tags FOR ALL USING (true);

-- Contact Notes policies
CREATE POLICY "Users can view non-private contact notes" ON public.contact_notes FOR SELECT USING (NOT is_private OR created_by = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can create contact notes" ON public.contact_notes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own contact notes" ON public.contact_notes FOR UPDATE USING (auth.uid() = created_by OR is_admin(auth.uid()));

-- Email Campaigns policies
CREATE POLICY "Users can view email campaigns" ON public.email_campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create email campaigns" ON public.email_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own email campaigns" ON public.email_campaigns FOR UPDATE USING (auth.uid() = created_by OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all email campaigns" ON public.email_campaigns FOR ALL USING (is_admin(auth.uid()));

-- SMS Campaigns policies
CREATE POLICY "Users can view sms campaigns" ON public.sms_campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create sms campaigns" ON public.sms_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own sms campaigns" ON public.sms_campaigns FOR UPDATE USING (auth.uid() = created_by OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all sms campaigns" ON public.sms_campaigns FOR ALL USING (is_admin(auth.uid()));

-- Conversation Threads policies
CREATE POLICY "Users can view conversation threads" ON public.conversation_threads FOR SELECT USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can create conversation threads" ON public.conversation_threads FOR INSERT WITH CHECK (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can update their assigned conversation threads" ON public.conversation_threads FOR UPDATE USING (auth.uid() = assigned_to OR is_admin(auth.uid()));

-- Workflows policies
CREATE POLICY "Users can view workflows" ON public.workflows FOR SELECT USING (true);
CREATE POLICY "Users can create workflows" ON public.workflows FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING (auth.uid() = created_by OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all workflows" ON public.workflows FOR ALL USING (is_admin(auth.uid()));

-- Workflow Actions policies
CREATE POLICY "Users can view workflow actions" ON public.workflow_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workflows WHERE workflows.id = workflow_actions.workflow_id AND (workflows.created_by = auth.uid() OR is_admin(auth.uid())))
);
CREATE POLICY "Users can manage workflow actions for their workflows" ON public.workflow_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workflows WHERE workflows.id = workflow_actions.workflow_id AND (workflows.created_by = auth.uid() OR is_admin(auth.uid())))
);

-- Workflow Executions policies
CREATE POLICY "Users can view workflow executions" ON public.workflow_executions FOR SELECT USING (true);
CREATE POLICY "System can manage workflow executions" ON public.workflow_executions FOR ALL USING (true);

-- Appointments policies
CREATE POLICY "Users can view appointments assigned to them" ON public.appointments FOR SELECT USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Users can update their assigned appointments" ON public.appointments FOR UPDATE USING (auth.uid() = assigned_to OR is_admin(auth.uid()));
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (is_admin(auth.uid()));

-- Calendar Settings policies
CREATE POLICY "Users can manage their own calendar settings" ON public.calendar_settings FOR ALL USING (auth.uid() = user_id);

-- CRM Analytics policies
CREATE POLICY "Users can view their own analytics" ON public.crm_analytics FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR is_admin(auth.uid()));
CREATE POLICY "System can insert analytics" ON public.crm_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all analytics" ON public.crm_analytics FOR ALL USING (is_admin(auth.uid()));

-- Insert default data
INSERT INTO public.lead_sources (name, description, source_type) VALUES 
('Website Form', 'Leads from website contact forms', 'website'),
('Social Media', 'Leads from social media platforms', 'social'),
('Referral', 'Leads from customer referrals', 'referral'),
('Cold Outreach', 'Leads from cold email/calling', 'manual'),
('Advertisement', 'Leads from paid advertising', 'ads');

INSERT INTO public.pipelines (name, description, is_default, created_by) VALUES 
('Sales Pipeline', 'Default sales pipeline for all deals', true, '00000000-0000-0000-0000-000000000000');

-- Get the pipeline ID for stages
INSERT INTO public.pipeline_stages (pipeline_id, name, description, stage_order, probability) 
SELECT id, 'Lead', 'Initial lead stage', 1, 10 FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Qualified', 'Qualified prospect', 2, 25 FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Proposal', 'Proposal sent', 3, 50 FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Negotiation', 'In negotiation', 4, 75 FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Closed Won', 'Deal won', 5, 100, true, false FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Closed Lost', 'Deal lost', 6, 0, false, true FROM public.pipelines WHERE is_default = true;