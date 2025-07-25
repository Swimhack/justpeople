import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === 'GET') {
      // Get query parameters
      const level = url.searchParams.get('level');
      const source = url.searchParams.get('source');
      const sessionId = url.searchParams.get('session_id');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const format = url.searchParams.get('format') || 'json';

      // Build query
      let query = supabase
        .from('application_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (level) {
        query = query.eq('level', level);
      }
      if (source) {
        query = query.eq('source', source);
      }
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data: logs, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return logs in requested format
      if (format === 'text') {
        const textLogs = logs.map(log => 
          `[${log.timestamp}] ${log.level.toUpperCase()} ${log.source || 'unknown'}: ${log.message}`
        ).join('\n');
        
        return new Response(textLogs, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      return new Response(JSON.stringify({ logs, total: logs.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (method === 'POST') {
      // Create a new log entry
      const body = await req.json();
      const { level, message, source, stackTrace, metadata, sessionId } = body;

      // Validate required fields
      if (!level || !message) {
        return new Response(JSON.stringify({ error: 'level and message are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get client info
      const userAgent = req.headers.get('User-Agent');
      const clientIP = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

      // Insert log entry
      const { data, error } = await supabase.rpc('log_application_event', {
        p_level: level,
        p_message: message,
        p_source: source,
        p_stack_trace: stackTrace,
        p_metadata: metadata || {},
        p_session_id: sessionId,
        p_user_agent: userAgent,
        p_ip_address: clientIP === 'unknown' ? null : clientIP
      });

      if (error) {
        console.error('Error creating log:', error);
        return new Response(JSON.stringify({ error: 'Failed to create log' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, logId: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in application-logs function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});