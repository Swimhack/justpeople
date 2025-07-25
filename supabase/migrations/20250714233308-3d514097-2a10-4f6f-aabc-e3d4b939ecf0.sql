-- Fix the pipeline stages insertion
INSERT INTO public.pipeline_stages (pipeline_id, name, description, stage_order, probability, is_closed_won, is_closed_lost) 
SELECT id, 'Lead', 'Initial lead stage', 1, 10, false, false FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Qualified', 'Qualified prospect', 2, 25, false, false FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Proposal', 'Proposal sent', 3, 50, false, false FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Negotiation', 'In negotiation', 4, 75, false, false FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Closed Won', 'Deal won', 5, 100, true, false FROM public.pipelines WHERE is_default = true
UNION ALL
SELECT id, 'Closed Lost', 'Deal lost', 6, 0, false, true FROM public.pipelines WHERE is_default = true;