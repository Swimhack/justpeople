import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: 'admin' | 'moderator' | 'user';
  personalMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check rate limiting for invitations (5 per hour per user)
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_action_type: 'invitation',
      p_max_requests: 5,
      p_window_minutes: 60
    });

    if (!rateLimitOk) {
      throw new Error('Rate limit exceeded. Please wait before sending more invitations.');
    }

    // Check if user is admin using secure function
    const { data: adminCheck } = await supabase.rpc('validate_admin_access', { user_id: user.id });
    if (!adminCheck) {
      throw new Error('Admin access required');
    }

    const { email, role, personalMessage }: InvitationRequest = await req.json();

    // Input validation and sanitization
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required');
    }

    if (!role || typeof role !== 'string') {
      throw new Error('Valid role is required');
    }

    if (personalMessage && typeof personalMessage !== 'string') {
      throw new Error('Personal message must be a string');
    }

    // Sanitize inputs to prevent XSS
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPersonalMessage = personalMessage ? personalMessage.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : undefined;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(sanitizedEmail)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    if (!['admin', 'moderator', 'user'].includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Additional length validation
    if (sanitizedEmail.length > 254) {
      throw new Error('Email address too long');
    }

    if (sanitizedPersonalMessage && sanitizedPersonalMessage.length > 1000) {
      throw new Error('Personal message too long');
    }

    // Generate secure invitation token using crypto
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const invitationToken = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    // Get inviter's profile
    const { data: inviterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching inviter profile:', profileError);
    }

    const inviterName = `${inviterProfile?.first_name || ''} ${inviterProfile?.last_name || ''}`.trim() || 'Someone';

    // Check if user already exists by querying profiles table
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle();
    
    if (existingProfileError) {
      console.error('Error checking existing profile:', existingProfileError);
    }
    
    if (existingProfile) {
      throw new Error('User with this email already exists');
    }

    // Check for existing pending invitation
    const { data: existingInvitation, error: existingInvitationError } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitationError) {
      console.error('Error checking existing invitation:', existingInvitationError);
    }

    if (existingInvitation) {
      throw new Error('Pending invitation already exists for this email');
    }

    // Create invitation record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data: invitation, error: createInvitationError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        token: invitationToken,
        invited_by: user.id,
        pre_assigned_role: role,
        expires_at: expiresAt.toISOString(),
        metadata: { personal_message: personalMessage }
      })
      .select()
      .single();

    if (createInvitationError) {
      throw createInvitationError;
    }

    // Get brand settings for email
    const { data: brandSettings } = await supabase
      .from('brand_settings')
      .select('setting_key, setting_value');

    const brandData = brandSettings?.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, any>) || {};

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('subject, html_content')
      .eq('template_key', 'user_invitation')
      .eq('is_active', true)
      .maybeSingle();

    if (templateError) {
      console.error('Error fetching email template:', templateError);
      throw new Error('Failed to load email template');
    }

    if (!template) {
      throw new Error('Email template not found');
    }

    // Create invitation link
    const baseUrl = req.headers.get('origin') || 'https://yourapp.com';
    const invitationLink = `${baseUrl}/invite/${invitationToken}`;

    // Prepare template variables
    const templateVars = {
      company_name: brandData.company_name || 'Your Company',
      company_tagline: brandData.company_tagline || 'Professional Business Solutions',
      primary_color: brandData.primary_color || '#3b82f6',
      secondary_color: brandData.secondary_color || '#10b981',
      invited_by_name: inviterName,
      role: role,
      invitation_link: invitationLink,
      expires_at: expiresAt.toLocaleDateString(),
      personal_message: personalMessage || ''
    };

    // Replace template variables
    let emailSubject = template.subject;
    let emailHtml = template.html_content;

    Object.entries(templateVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      emailSubject = emailSubject.replace(regex, String(value));
      emailHtml = emailHtml.replace(regex, String(value));
    });

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: `${brandData.email_from_name || 'Your Company'} <${brandData.email_from_address || 'noreply@yourcompany.com'}>`,
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Invitation sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      invitationId: invitation.id,
      message: "Invitation sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: "Failed to send invitation"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);