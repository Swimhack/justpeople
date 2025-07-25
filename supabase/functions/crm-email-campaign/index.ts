import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailCampaignRequest {
  campaign_id?: string;
  action: 'create' | 'send' | 'schedule' | 'test';
  campaign_data?: {
    name: string;
    subject_line: string;
    content: string;
    target_audience: any;
    send_at?: string;
  };
  test_email?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const { campaign_id, action, campaign_data, test_email }: EmailCampaignRequest = await req.json();

    console.log('Processing email campaign:', { action, campaign_id });

    if (action === 'create') {
      if (!campaign_data) {
        throw new Error('Campaign data is required for create action');
      }

      // Get authenticated user
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header required');
      }

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        throw new Error('Invalid authentication');
      }

      // Create email campaign
      const { data: campaign, error: createError } = await supabaseClient
        .from('email_campaigns')
        .insert({
          name: campaign_data.name,
          subject_line: campaign_data.subject_line,
          custom_fields: { content: campaign_data.content },
          target_audience: campaign_data.target_audience,
          send_at: campaign_data.send_at,
          status: campaign_data.send_at ? 'scheduled' : 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          campaign,
          message: 'Email campaign created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send' && campaign_id) {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseClient
        .from('email_campaigns')
        .select('*')
        .eq('id', campaign_id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Build target audience query
      let contactsQuery = supabaseClient.from('contacts').select('email, name');
      
      // Apply audience filters
      if (campaign.target_audience.tags) {
        contactsQuery = contactsQuery.contains('tags', campaign.target_audience.tags);
      }
      
      if (campaign.target_audience.lead_score_min) {
        contactsQuery = contactsQuery.gte('lead_score', campaign.target_audience.lead_score_min);
      }

      const { data: contacts, error: contactsError } = await contactsQuery;
      
      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        throw new Error('No contacts match the target audience criteria');
      }

      // Send emails
      const emailPromises = contacts.map(async (contact) => {
        try {
          const personalizedSubject = campaign.subject_line.replace('{{name}}', contact.name || 'there');
          const personalizedContent = campaign.custom_fields.content.replace(/{{name}}/g, contact.name || 'there');

          const emailResponse = await resend.emails.send({
            from: 'CRM <noreply@yourdomain.com>',
            to: [contact.email],
            subject: personalizedSubject,
            html: personalizedContent,
          });

          return { 
            contact_email: contact.email, 
            success: true, 
            message_id: emailResponse.data?.id 
          };
        } catch (error: any) {
          console.error(`Failed to send email to ${contact.email}:`, error);
          return { 
            contact_email: contact.email, 
            success: false, 
            error: error.message 
          };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Update campaign status
      await supabaseClient
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          custom_fields: {
            ...campaign.custom_fields,
            send_results: {
              total_sent: successCount,
              total_failed: failureCount,
              results: results
            }
          }
        })
        .eq('id', campaign_id);

      return new Response(
        JSON.stringify({ 
          success: true,
          campaign_id,
          total_contacts: contacts.length,
          successful_sends: successCount,
          failed_sends: failureCount,
          message: `Email campaign sent to ${successCount} recipients`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'test' && campaign_id && test_email) {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseClient
        .from('email_campaigns')
        .select('*')
        .eq('id', campaign_id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Send test email
      const testSubject = `[TEST] ${campaign.subject_line}`;
      const testContent = `
        <div style="background: #f0f0f0; padding: 20px; margin-bottom: 20px; border-radius: 5px;">
          <strong>This is a test email for campaign: ${campaign.name}</strong>
        </div>
        ${campaign.custom_fields.content}
      `;

      const emailResponse = await resend.emails.send({
        from: 'CRM Test <noreply@yourdomain.com>',
        to: [test_email],
        subject: testSubject,
        html: testContent,
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          test_email,
          message_id: emailResponse.data?.id,
          message: 'Test email sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action or missing parameters');

  } catch (error: any) {
    console.error('Error in crm-email-campaign:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Failed to process email campaign'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});