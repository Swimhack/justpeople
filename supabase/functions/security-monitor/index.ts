import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get real-time security anomalies
    const { data: anomalies, error: anomaliesError } = await supabase
      .rpc('detect_security_anomalies');

    if (anomaliesError) {
      console.error('Error detecting anomalies:', anomaliesError);
      throw anomaliesError;
    }

    // Get recent security events
    const { data: securityEvents, error: eventsError } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('resource_type', 'security_event')
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error('Error fetching security events:', eventsError);
      throw eventsError;
    }

    // Get failed login attempts in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: failedLogins, error: loginsError } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('success', false)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (loginsError) {
      console.error('Error fetching failed logins:', loginsError);
      throw loginsError;
    }

    // Calculate security metrics
    const securityMetrics = {
      activeAnomalies: anomalies?.length || 0,
      recentFailedLogins: failedLogins?.length || 0,
      highSeverityEvents: anomalies?.filter(a => a.severity === 'high').length || 0,
      securityScore: calculateSecurityScore(anomalies, failedLogins, securityEvents),
    };

    // Send alerts for high-severity issues
    const highSeverityAnomalies = anomalies?.filter(a => a.severity === 'high') || [];
    if (highSeverityAnomalies.length > 0) {
      console.log(`🚨 HIGH SEVERITY ALERT: ${highSeverityAnomalies.length} critical security anomalies detected`);
      
      // Log alert in admin logs
      await supabase.from('admin_logs').insert({
        admin_id: '00000000-0000-0000-0000-000000000000',
        action: 'security_alert_triggered',
        resource_type: 'security_monitor',
        metadata: {
          anomaly_count: highSeverityAnomalies.length,
          anomalies: highSeverityAnomalies,
          alert_level: 'high'
        }
      });
    }

    // Create monitoring report
    const report = {
      timestamp: new Date().toISOString(),
      status: securityMetrics.highSeverityEvents > 0 ? 'critical' : 
              securityMetrics.activeAnomalies > 0 ? 'warning' : 'ok',
      metrics: securityMetrics,
      anomalies: anomalies || [],
      recentEvents: securityEvents?.slice(0, 10) || [],
      failedLoginSummary: {
        total: failedLogins?.length || 0,
        uniqueIPs: [...new Set(failedLogins?.map(l => l.ip_address) || [])].length,
        uniqueEmails: [...new Set(failedLogins?.map(l => l.identifier) || [])].length
      }
    };

    return new Response(
      JSON.stringify(report),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Security monitoring error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Security monitoring failed',
        message: error.message 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    );
  }
});

function calculateSecurityScore(anomalies: any[], failedLogins: any[], events: any[]): number {
  let score = 100;
  
  // Deduct points for anomalies
  const highSeverityAnomalies = anomalies?.filter(a => a.severity === 'high').length || 0;
  const mediumSeverityAnomalies = anomalies?.filter(a => a.severity === 'medium').length || 0;
  
  score -= (highSeverityAnomalies * 20);
  score -= (mediumSeverityAnomalies * 10);
  
  // Deduct points for failed logins
  const failedLoginCount = failedLogins?.length || 0;
  if (failedLoginCount > 20) score -= 15;
  else if (failedLoginCount > 10) score -= 10;
  else if (failedLoginCount > 5) score -= 5;
  
  // Deduct points for recent security events
  const recentSecurityEvents = events?.filter(e => 
    new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length || 0;
  
  if (recentSecurityEvents > 10) score -= 10;
  else if (recentSecurityEvents > 5) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}