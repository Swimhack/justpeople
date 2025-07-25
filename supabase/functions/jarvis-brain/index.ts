import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JarvisRequest {
  message: string;
  provider?: 'openai' | 'claude';
  context_keys?: string[];
  memory_search?: boolean;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, provider = 'openai', context_keys = [], memory_search = true, user_id }: JarvisRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();

    // Step 1: Generate embedding for the user message
    let queryEmbedding: number[] = [];
    
    if (provider === 'openai') {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: message,
          model: 'text-embedding-ada-002',
        }),
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        queryEmbedding = embeddingData.data[0].embedding;
      }
    }

    // Step 2: Retrieve similar memories and context
    let memories: any[] = [];
    let contextData: any[] = [];

    if (memory_search && queryEmbedding.length > 0) {
      // Find similar memories
      const { data: memoriesData } = await supabase.rpc('find_similar_memories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5
      });
      memories = memoriesData || [];

      // Get brain context
      const { data: contextResults } = await supabase.rpc('get_brain_context', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 10
      });
      contextData = contextResults || [];
    }

    // Step 3: Get active system prompt
    const { data: promptData } = await supabase.rpc('get_active_prompt', {
      provider_name: provider
    });

    const systemPrompt = promptData?.[0] || {
      prompt_template: provider === 'openai' 
        ? 'You are Jarvis, an AI assistant. Respond helpfully and accurately.'
        : 'You are Vision, an AI assistant. Provide intelligent responses.',
      parameters: { temperature: 0.3, max_tokens: 1500 }
    };

    // Step 4: Build comprehensive context
    const contextString = [
      memories.length > 0 ? `Relevant Memories:\n${memories.map(m => `- ${m.content} (${m.memory_type})`).join('\n')}` : '',
      contextData.length > 0 ? `\nSystem Context:\n${contextData.map(c => `- ${c.context_key}: ${JSON.stringify(c.context_data)}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    const systemState = {
      active_memories: memories.length,
      context_available: contextData.length,
      provider_used: provider,
      timestamp: new Date().toISOString()
    };

    // Step 5: Prepare the final prompt
    const finalPrompt = systemPrompt.prompt_template
      .replace('{context}', contextString || 'No specific context available')
      .replace('{system_state}', JSON.stringify(systemState, null, 2))
      .replace('{memory_state}', `${memories.length} memories found, ${contextData.length} context items`)
      .replace('{user_input}', message);

    // Step 6: Call the AI provider
    let aiResponse = '';
    let tokensUsed = 0;

    if (provider === 'openai') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: finalPrompt },
            { role: 'user', content: message }
          ],
          temperature: systemPrompt.parameters?.temperature || 0.3,
          max_tokens: systemPrompt.parameters?.max_tokens || 1500,
        }),
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        aiResponse = data.choices[0].message.content;
        tokensUsed = data.usage?.total_tokens || 0;
      } else {
        throw new Error('OpenAI API request failed');
      }
    } else if (provider === 'claude') {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('ANTHROPIC_API_KEY')}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: systemPrompt.parameters?.max_tokens || 1500,
          messages: [
            { role: 'user', content: finalPrompt }
          ],
        }),
      });

      if (claudeResponse.ok) {
        const data = await claudeResponse.json();
        aiResponse = data.content?.[0]?.text || 'No response generated';
        tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
      } else {
        throw new Error('Claude API request failed');
      }
    }

    const processingTime = Date.now() - startTime;

    // Step 7: Log the interaction
    await supabase.from('ai_interactions').insert({
      prompt_id: promptData?.[0]?.id,
      input: message,
      output: aiResponse,
      processing_time_ms: processingTime,
      tokens_used: tokensUsed,
      ai_provider: provider,
      context_used: {
        memories_count: memories.length,
        context_count: contextData.length,
        context_keys: context_keys
      },
      user_id: user_id
    });

    // Step 8: Update access tracking for used context
    for (const ctx of contextData) {
      await supabase.rpc('track_context_access', {
        context_key_param: ctx.context_key
      });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        metadata: {
          provider: provider,
          processing_time_ms: processingTime,
          tokens_used: tokensUsed,
          memories_used: memories.length,
          context_used: contextData.length,
          timestamp: new Date().toISOString()
        },
        context_summary: {
          memories: memories.map(m => ({ type: m.memory_type, relevance: m.relevance_score })),
          context_keys: contextData.map(c => c.context_key)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in jarvis-brain function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request with Jarvis brain',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});