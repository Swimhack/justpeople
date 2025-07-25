import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  prompt: string;
  context?: string;
  type?: 'general' | 'analysis' | 'summary' | 'recommendation' | 'draft';
  maxTokens?: number;
}

const getSystemPrompt = (type: string) => {
  const basePrompt = `You are Claude, an AI assistant integrated into the JJP Solutions Admin Dashboard. You help with business tasks, analysis, and productivity. Always be professional, accurate, and helpful.`;
  
  switch (type) {
    case 'analysis':
      return `${basePrompt} You specialize in business analysis. Provide detailed, data-driven insights and actionable recommendations. Structure your analysis clearly with key findings, implications, and next steps.`;
    
    case 'summary':
      return `${basePrompt} You excel at creating concise, comprehensive summaries. Extract key points, highlight important details, and organize information logically. Focus on what business leaders need to know.`;
    
    case 'recommendation':
      return `${basePrompt} You provide strategic business recommendations. Consider multiple perspectives, weigh pros and cons, and suggest practical implementation steps. Be specific and actionable.`;
    
    case 'draft':
      return `${basePrompt} You help draft professional business communications. Maintain appropriate tone, clear structure, and professional language suitable for business contexts.`;
    
    default:
      return `${basePrompt} Respond to business queries with accuracy and professionalism. Provide helpful, actionable information relevant to business operations.`;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context, type = 'general', maxTokens = 1000 }: AIRequest = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = getSystemPrompt(type);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context ? [{ role: 'user', content: `Context: ${context}` }] : []),
      { role: 'user', content: prompt }
    ];

    console.log('Sending request to Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response received successfully');

    const assistantResponse = data.content?.[0]?.text || 'No response generated';

    return new Response(
      JSON.stringify({ 
        response: assistantResponse,
        type: type,
        tokens_used: data.usage?.input_tokens + data.usage?.output_tokens || 0,
        model: 'claude-sonnet-4-20250514'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI request',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});