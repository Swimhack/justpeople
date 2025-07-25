import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password, firstName, lastName }: AcceptInvitationRequest = await req.json();

    // Input validation
    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate password strength
    if (password.length < 12) {
      return new Response(JSON.stringify({ error: 'Password must be at least 12 characters long' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Find and validate invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invalid or expired invitation' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      // Mark invitation as expired
      await supabase
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return new Response(JSON.stringify({ error: 'Invitation has expired' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
        invited_by: invitation.invited_by,
        invitation_accepted_at: new Date().toISOString()
      }
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: invitation.email,
        first_name: firstName || '',
        last_name: lastName || ''
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Assign the role from the invitation
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: invitation.pre_assigned_role
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: authData.user.id
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Account created successfully",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: invitation.pre_assigned_role
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in accept-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: "Failed to accept invitation"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);