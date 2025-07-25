import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, context = {}, conversation_history = [] } = await req.json();

    console.log('WOOC Assistant query:', message);

    // Get relevant project context
    const { data: prds } = await supabase
      .from('content')
      .select('title, content, metadata')
      .eq('metadata->>type', 'prd')
      .limit(5);

    const { data: discussions } = await supabase
      .from('dev_threads')
      .select('title, description, status, priority')
      .limit(5);

    const projectContext = {
      prds: prds || [],
      discussions: discussions || [],
      ...context
    };

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are WOOC (Walking Out of Chaos) AI Assistant, an expert AI project management consultant and assistant. You help teams navigate complex AI/ML projects with practical guidance, best practices, and actionable recommendations.

Your expertise includes:
- AI/ML project planning and architecture
- Product Requirements Documents (PRDs) 
- Risk assessment and mitigation
- Team collaboration and communication
- Technical implementation strategies
- Project timeline and milestone planning

Current Project Context:
PRDs: ${JSON.stringify(projectContext.prds)}
Active Discussions: ${JSON.stringify(projectContext.discussions)}

Guidelines:
- Be practical and actionable in your advice
- Reference specific project context when relevant
- Provide structured recommendations when possible
- Ask clarifying questions when needed
- Focus on helping teams succeed with their AI projects
- Be concise but thorough
- Use a collaborative, encouraging tone`
      },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call Claude 4 Opus
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: messages.slice(1), // Remove system message for Anthropic format
        system: messages[0].content
      })
    });

    const claudeData = await claudeResponse.json();
    
    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeData.error?.message || 'Unknown error'}`);
    }

    const assistantResponse = claudeData.content[0].text;

    // Store interaction
    const { error: insertError } = await supabase
      .from('ai_interactions')
      .insert({
        ai_provider: 'anthropic',
        input: message,
        output: assistantResponse,
        context_used: { 
          conversation_length: conversation_history.length,
          project_context: projectContext,
          interaction_type: 'wooc_assistant'
        },
        tokens_used: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || 0,
        processing_time_ms: Date.now()
      });

    if (insertError) {
      console.error('Failed to store interaction:', insertError);
    }

    console.log('WOOC Assistant response generated successfully');

    return new Response(JSON.stringify({
      response: assistantResponse,
      context_used: projectContext,
      metadata: {
        tokens_used: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || 0,
        response_time: Date.now()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wooc-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});