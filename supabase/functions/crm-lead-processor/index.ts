import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  lead_source_id?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: leadData, action = 'create' }: { data: LeadData; action?: string } = await req.json();

    console.log('Processing lead:', { action, email: leadData.email });

    if (action === 'create') {
      // Check if lead already exists
      const { data: existingLead } = await supabaseClient
        .from('leads')
        .select('id, email, lead_score')
        .eq('email', leadData.email)
        .single();

      if (existingLead) {
        // Update existing lead score and activity
        const newScore = Math.min(100, existingLead.lead_score + 10);
        
        const { data: updatedLead, error: updateError } = await supabaseClient
          .from('leads')
          .update({
            lead_score: newScore,
            last_activity_at: new Date().toISOString(),
            tags: leadData.tags || []
          })
          .eq('id', existingLead.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Log activity
        await supabaseClient
          .from('lead_activities')
          .insert({
            lead_id: existingLead.id,
            activity_type: 'lead_updated',
            description: 'Lead information updated from form submission',
            metadata: { previous_score: existingLead.lead_score, new_score: newScore }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            lead: updatedLead, 
            action: 'updated',
            message: 'Existing lead updated with new activity'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate initial lead score
      let leadScore = 10; // Base score
      if (leadData.phone) leadScore += 15;
      if (leadData.company) leadScore += 10;
      if (leadData.first_name && leadData.last_name) leadScore += 5;

      // Auto-assign to admin user for now (in production, use round-robin assignment)
      const { data: adminUser } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      // Create new lead
      const { data: newLead, error: createError } = await supabaseClient
        .from('leads')
        .insert({
          ...leadData,
          lead_score: leadScore,
          assigned_to: adminUser?.user_id,
          qualification_status: leadScore >= 30 ? 'marketing_qualified' : 'unqualified'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Log initial activity
      await supabaseClient
        .from('lead_activities')
        .insert({
          lead_id: newLead.id,
          activity_type: 'lead_created',
          description: 'New lead created from form submission',
          metadata: { initial_score: leadScore, source: 'form_submission' }
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          lead: newLead,
          action: 'created',
          message: 'New lead created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'score') {
      // Update lead scoring based on engagement
      const { lead_id, activity_type, engagement_data } = leadData as any;
      
      const { data: lead } = await supabaseClient
        .from('leads')
        .select('lead_score')
        .eq('id', lead_id)
        .single();

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Calculate score increase based on activity
      let scoreIncrease = 0;
      switch (activity_type) {
        case 'email_opened':
          scoreIncrease = 2;
          break;
        case 'email_clicked':
          scoreIncrease = 5;
          break;
        case 'website_visit':
          scoreIncrease = 3;
          break;
        case 'form_submission':
          scoreIncrease = 10;
          break;
        case 'phone_answered':
          scoreIncrease = 15;
          break;
        default:
          scoreIncrease = 1;
      }

      const newScore = Math.min(100, lead.lead_score + scoreIncrease);

      // Update lead score
      const { data: updatedLead, error: updateError } = await supabaseClient
        .from('leads')
        .update({
          lead_score: newScore,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', lead_id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log activity
      await supabaseClient
        .from('lead_activities')
        .insert({
          lead_id: lead_id,
          activity_type: activity_type,
          description: `Lead engaged with ${activity_type.replace('_', ' ')}`,
          metadata: { 
            score_increase: scoreIncrease,
            new_score: newScore,
            engagement_data 
          }
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          lead: updatedLead,
          score_increase: scoreIncrease,
          message: 'Lead score updated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action specified');

  } catch (error: any) {
    console.error('Error in crm-lead-processor:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Failed to process lead'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});