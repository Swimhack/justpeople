import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  templateType?: 'contact_confirmation' | 'contact_notification' | 'welcome' | 'custom';
  templateData?: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any>) => {
  switch (type) {
    case 'contact_confirmation':
      return {
        subject: `Thank you for contacting JJP Solutions, ${data.name}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #10b981); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">JJP Solutions</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Professional Business Solutions</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;">
              <h2 style="color: #1e293b; margin-top: 0;">Thank you for reaching out!</h2>
              <p style="color: #475569; line-height: 1.6;">
                Dear ${data.name},
              </p>
              <p style="color: #475569; line-height: 1.6;">
                We have received your message and appreciate you taking the time to contact us. 
                Our team will review your inquiry and respond within 24 hours.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; margin-top: 0;">Your Message:</h3>
                <p style="color: #64748b; margin: 5px 0;"><strong>Subject:</strong> ${data.subject}</p>
                <p style="color: #64748b; margin: 5px 0;"><strong>Company:</strong> ${data.company || 'Not specified'}</p>
                <p style="color: #64748b; line-height: 1.6;"><strong>Message:</strong></p>
                <p style="color: #475569; line-height: 1.6; font-style: italic;">${data.message}</p>
              </div>
              <p style="color: #475569; line-height: 1.6;">
                Best regards,<br>
                <strong>The JJP Solutions Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 14px;">
                © 2024 JJP Solutions. All rights reserved.
              </p>
            </div>
          </div>
        `
      };
      
    case 'contact_notification':
      return {
        subject: `New Contact Form Submission from ${data.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626, #ea580c); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚨 New Contact Submission</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">JJP Solutions Admin Dashboard</p>
            </div>
            
            <div style="background: #fef2f2; padding: 30px; border-radius: 10px; border-left: 4px solid #dc2626;">
              <h2 style="color: #1e293b; margin-top: 0;">Contact Details</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 10px 0;"><strong>Name:</strong> ${data.name}</p>
                <p style="color: #64748b; margin: 10px 0;"><strong>Email:</strong> ${data.email}</p>
                <p style="color: #64748b; margin: 10px 0;"><strong>Company:</strong> ${data.company || 'Not specified'}</p>
                <p style="color: #64748b; margin: 10px 0;"><strong>Subject:</strong> ${data.subject}</p>
                <p style="color: #64748b; margin: 10px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #64748b; margin: 10px 0;"><strong>Message:</strong></p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <p style="color: #475569; line-height: 1.6; margin: 0;">${data.message}</p>
                </div>
              </div>
            </div>
          </div>
        `
      };
      
    case 'welcome':
      return {
        subject: 'Welcome to JJP Solutions Admin Dashboard',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #10b981); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to JJP Solutions!</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your admin dashboard is ready</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;">
              <h2 style="color: #1e293b; margin-top: 0;">Welcome ${data.name}!</h2>
              <p style="color: #475569; line-height: 1.6;">
                Your JJP Solutions admin dashboard account has been successfully created. 
                You now have access to our comprehensive business management platform.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e293b; margin-top: 0;">What you can do:</h3>
                <ul style="color: #475569; line-height: 1.8;">
                  <li>📊 Monitor business metrics and analytics</li>
                  <li>💬 Manage secure partner communications</li>
                  <li>🤖 Leverage AI-powered insights</li>
                  <li>📧 Handle contact management</li>
                  <li>⚙️ Configure system settings</li>
                </ul>
              </div>
              <p style="color: #475569; line-height: 1.6;">
                If you have any questions, don't hesitate to reach out to our support team.
              </p>
            </div>
          </div>
        `
      };
      
    default:
      return {
        subject: data.subject || 'Message from JJP Solutions',
        html: data.html || data.text || 'No content provided'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    
    let emailContent;
    
    if (emailRequest.templateType && emailRequest.templateData) {
      emailContent = getEmailTemplate(emailRequest.templateType, emailRequest.templateData);
    } else {
      emailContent = {
        subject: emailRequest.subject,
        html: emailRequest.html,
        text: emailRequest.text
      };
    }

    const emailResponse = await resend.emails.send({
      from: emailRequest.from || "JJP Solutions <noreply@jjpsolutions.com>",
      to: emailRequest.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text || emailRequest.text,
      replyTo: emailRequest.replyTo
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: "Failed to send email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);