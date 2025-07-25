import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoryRequest {
  content: string;
  memory_type?: string;
  source_type?: string;
  relevance_score?: number;
  metadata?: any;
  context_key?: string;
  context_data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      content, 
      memory_type = 'general', 
      source_type = 'manual',
      relevance_score = 0.5,
      metadata = {},
      context_key,
      context_data
    }: MemoryRequest = await req.json();

    if (!content && !context_key) {
      return new Response(
        JSON.stringify({ error: 'Content or context_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let results: any = {};

    // Generate embedding for content
    if (content) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: content,
          model: 'text-embedding-ada-002',
        }),
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Store memory
        const { data: memoryData, error: memoryError } = await supabase
          .from('ai_memories')
          .insert({
            content,
            embedding,
            memory_type,
            source_type,
            relevance_score,
            metadata
          })
          .select()
          .single();

        if (memoryError) {
          throw new Error(`Failed to store memory: ${memoryError.message}`);
        }

        results.memory = memoryData;
      } else {
        throw new Error('Failed to generate embedding for memory');
      }
    }

    // Store brain context if provided
    if (context_key && context_data) {
      const contextEmbeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: JSON.stringify(context_data),
          model: 'text-embedding-ada-002',
        }),
      });

      if (contextEmbeddingResponse.ok) {
        const embeddingData = await contextEmbeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Store or update context
        const { data: contextResult, error: contextError } = await supabase
          .from('brain_context')
          .upsert({
            context_key,
            context_data,
            embedding,
            relevance_weights: metadata?.relevance_weights || {}
          })
          .select()
          .single();

        if (contextError) {
          throw new Error(`Failed to store context: ${contextError.message}`);
        }

        results.context = contextResult;
      } else {
        throw new Error('Failed to generate embedding for context');
      }
    }

    // Memory consolidation: find and merge similar memories
    if (content && results.memory) {
      const { data: similarMemories } = await supabase.rpc('find_similar_memories', {
        query_embedding: results.memory.embedding,
        match_threshold: 0.9, // High threshold for very similar memories
        match_count: 3
      });

      if (similarMemories && similarMemories.length > 1) {
        // If we find very similar memories, we could consolidate them
        const duplicateIds = similarMemories
          .filter(m => m.id !== results.memory.id)
          .map(m => m.id);

        if (duplicateIds.length > 0) {
          results.consolidation = {
            similar_memories_found: duplicateIds.length,
            action: 'flagged_for_review' // Could be automated in the future
          };
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Successfully processed ${content ? 'memory' : ''}${content && context_key ? ' and ' : ''}${context_key ? 'context' : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in memory-processor function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process memory/context',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});