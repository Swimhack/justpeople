import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationRequest {
  action: 'send' | 'send_test' | 'process_queue';
  user_id?: string;
  notification_type: string;
  priority?: string;
  data?: Record<string, any>;
  channels?: string[];
}

interface NotificationTemplate {
  id: string;
  template_key: string;
  channel: string;
  subject_template?: string;
  body_template: string;
  variables: string[];
}

interface NotificationPreference {
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  priority_level: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
}

// Template rendering function
function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

// Check if notification should be sent based on quiet hours
function isWithinQuietHours(preference: NotificationPreference): boolean {
  if (!preference.quiet_hours_start || !preference.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const timezone = preference.timezone || 'UTC';
  
  // For simplicity, we'll just check UTC time
  // In production, you'd want to properly handle timezone conversion
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = preference.quiet_hours_start.split(':').map(Number);
  const [endHour, endMinute] = preference.quiet_hours_end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

// Send email notification
async function sendEmail(
  to: string,
  subject: string,
  content: string,
  metadata: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailResponse = await resend.emails.send({
      from: "JJP Solutions <noreply@jjpsolutions.com>",
      to: [to],
      subject,
      html: content,
    });

    console.log("Email sent successfully:", emailResponse);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// Send SMS notification (Twilio integration would go here)
async function sendSMS(
  to: string,
  content: string,
  metadata: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // This is where you'd integrate with Twilio
    console.log("SMS would be sent to:", to, "Content:", content);
    
    // For demo purposes, we'll just log it
    return { success: true };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

// Send push notification
async function sendPushNotification(
  userId: string,
  title: string,
  content: string,
  metadata: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token, device_type')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!tokens || tokens.length === 0) {
      return { success: false, error: 'No active device tokens found' };
    }

    // This is where you'd integrate with Firebase Cloud Messaging or OneSignal
    console.log("Push notification would be sent to tokens:", tokens, "Title:", title, "Content:", content);
    
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message };
  }
}

// Create in-app notification
async function createInAppNotification(
  userId: string,
  notificationType: string,
  channel: string,
  templateId: string,
  subject: string,
  content: string,
  metadata: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: notificationType,
        channel,
        template_id: templateId,
        status: 'delivered',
        subject,
        content,
        metadata,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error creating in-app notification:", error);
    return { success: false, error: error.message };
  }
}

// Main notification processing function
async function processNotification(request: NotificationRequest) {
  try {
    const { user_id, notification_type, data = {}, channels } = request;

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .eq('notification_type', notification_type)
      .single();

    if (!preferences) {
      console.log(`No preferences found for user ${user_id} and type ${notification_type}`);
      return { success: false, error: 'No preferences found' };
    }

    // Check quiet hours
    if (isWithinQuietHours(preferences) && preferences.priority_level !== 'urgent') {
      console.log(`Notification delayed due to quiet hours for user ${user_id}`);
      
      // Queue notification for later
      await supabase
        .from('notification_queue')
        .insert({
          user_id,
          notification_type,
          channel: 'delayed',
          priority: preferences.priority_level,
          payload: request,
        });
      
      return { success: true, message: 'Notification queued due to quiet hours' };
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('user_id', user_id)
      .single();

    if (!profile?.email) {
      console.log(`No email found for user ${user_id}`);
    }

    // Determine which channels to use
    const enabledChannels = [];
    if (preferences.email_enabled && profile?.email && (!channels || channels.includes('email'))) {
      enabledChannels.push('email');
    }
    if (preferences.sms_enabled && (!channels || channels.includes('sms'))) {
      enabledChannels.push('sms');
    }
    if (preferences.push_enabled && (!channels || channels.includes('push'))) {
      enabledChannels.push('push');
    }
    if (preferences.in_app_enabled && (!channels || channels.includes('in_app'))) {
      enabledChannels.push('in_app');
    }

    const results = [];

    // Process each enabled channel
    for (const channel of enabledChannels) {
      try {
        // Get template for this channel
        const { data: template } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('channel', channel)
          .ilike('template_key', `%${notification_type}%`)
          .eq('is_active', true)
          .single();

        if (!template) {
          console.log(`No template found for channel ${channel} and type ${notification_type}`);
          continue;
        }

        // Prepare template variables
        const templateVars = {
          user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User',
          ...data,
        };

        const subject = template.subject_template 
          ? renderTemplate(template.subject_template, templateVars)
          : undefined;
        const content = renderTemplate(template.body_template, templateVars);

        let result;
        switch (channel) {
          case 'email':
            if (profile?.email) {
              result = await sendEmail(profile.email, subject || '', content, data);
            }
            break;
          case 'sms':
            result = await sendSMS('', content, data); // Phone number would come from profile
            break;
          case 'push':
            result = await sendPushNotification(user_id, subject || '', content, data);
            break;
          case 'in_app':
            result = await createInAppNotification(
              user_id,
              notification_type,
              channel,
              template.id,
              subject || '',
              content,
              data
            );
            break;
        }

        // Log the notification attempt
        await supabase
          .from('notification_logs')
          .insert({
            user_id,
            notification_type,
            channel,
            template_id: template.id,
            status: result?.success ? 'sent' : 'failed',
            subject,
            content,
            metadata: data,
            error_message: result?.error,
            sent_at: result?.success ? new Date().toISOString() : null,
          });

        results.push({ channel, ...result });
      } catch (error) {
        console.error(`Error processing channel ${channel}:`, error);
        results.push({ channel, success: false, error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error processing notification:', error);
    return { success: false, error: error.message };
  }
}

// Send test notification
async function sendTestNotification(userId: string) {
  return await processNotification({
    action: 'send',
    user_id: userId,
    notification_type: 'system',
    priority: 'normal',
    data: {
      alert_type: 'Test Notification',
      priority: 'Normal',
      alert_message: 'This is a test notification to verify your notification settings are working correctly.',
    },
  });
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: NotificationRequest = await req.json();
    console.log('Processing notification request:', request);

    let result;
    switch (request.action) {
      case 'send_test':
        // Get user ID from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
          throw new Error('Authorization header required');
        }

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!user) {
          throw new Error('Invalid authentication');
        }

        result = await sendTestNotification(user.id);
        break;
      case 'send':
        result = await processNotification(request);
        break;
      case 'process_queue':
        // This would process queued notifications
        result = { success: true, message: 'Queue processing not implemented yet' };
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notification-engine function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);