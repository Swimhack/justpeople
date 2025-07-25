import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromptRequest {
  action: 'get' | 'create' | 'update' | 'activate' | 'test';
  provider?: 'openai' | 'claude';
  prompt_data?: {
    name: string;
    prompt_template: string;
    parameters?: any;
  };
  prompt_id?: string;
  test_message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, provider = 'openai', prompt_data, prompt_id, test_message }: PromptRequest = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result: any = {};

    switch (action) {
      case 'get':
        // Get all prompts or active prompt for provider
        const { data: prompts, error: getError } = await supabase
          .from('system_prompts')
          .select('*')
          .eq('ai_provider', provider)
          .order('created_at', { ascending: false });

        if (getError) throw new Error(`Failed to get prompts: ${getError.message}`);

        result = {
          prompts,
          active_prompt: prompts?.find(p => p.is_active) || null
        };
        break;

      case 'create':
        if (!prompt_data) {
          throw new Error('Prompt data is required for create action');
        }

        const { data: newPrompt, error: createError } = await supabase
          .from('system_prompts')
          .insert({
            name: prompt_data.name,
            prompt_template: prompt_data.prompt_template,
            ai_provider: provider,
            parameters: prompt_data.parameters || {},
            is_active: false
          })
          .select()
          .single();

        if (createError) throw new Error(`Failed to create prompt: ${createError.message}`);

        result = { prompt: newPrompt };
        break;

      case 'update':
        if (!prompt_id || !prompt_data) {
          throw new Error('Prompt ID and data are required for update action');
        }

        const { data: updatedPrompt, error: updateError } = await supabase
          .from('system_prompts')
          .update({
            name: prompt_data.name,
            prompt_template: prompt_data.prompt_template,
            parameters: prompt_data.parameters
          })
          .eq('id', prompt_id)
          .select()
          .single();

        if (updateError) throw new Error(`Failed to update prompt: ${updateError.message}`);

        result = { prompt: updatedPrompt };
        break;

      case 'activate':
        if (!prompt_id) {
          throw new Error('Prompt ID is required for activate action');
        }

        // First deactivate all prompts for this provider
        await supabase
          .from('system_prompts')
          .update({ is_active: false })
          .eq('ai_provider', provider);

        // Then activate the specified prompt
        const { data: activatedPrompt, error: activateError } = await supabase
          .from('system_prompts')
          .update({ is_active: true })
          .eq('id', prompt_id)
          .select()
          .single();

        if (activateError) throw new Error(`Failed to activate prompt: ${activateError.message}`);

        result = { prompt: activatedPrompt };
        break;

      case 'test':
        if (!prompt_id || !test_message) {
          throw new Error('Prompt ID and test message are required for test action');
        }

        // Get the prompt to test
        const { data: testPrompt, error: testPromptError } = await supabase
          .from('system_prompts')
          .select('*')
          .eq('id', prompt_id)
          .single();

        if (testPromptError) throw new Error(`Failed to get prompt: ${testPromptError.message}`);

        // Format the prompt with test data
        const testSystemPrompt = testPrompt.prompt_template
          .replace('{context}', 'Test context - no specific data available')
          .replace('{system_state}', JSON.stringify({ test_mode: true, timestamp: new Date().toISOString() }))
          .replace('{memory_state}', 'Test mode - no memories loaded')
          .replace('{user_input}', test_message);

        // Test with the AI provider
        let testResponse = '';
        const startTime = Date.now();

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
                { role: 'system', content: testSystemPrompt },
                { role: 'user', content: test_message }
              ],
              temperature: testPrompt.parameters?.temperature || 0.3,
              max_tokens: testPrompt.parameters?.max_tokens || 500,
            }),
          });

          if (openaiResponse.ok) {
            const data = await openaiResponse.json();
            testResponse = data.choices[0].message.content;
          } else {
            throw new Error('OpenAI test request failed');
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
              max_tokens: testPrompt.parameters?.max_tokens || 500,
              messages: [
                { role: 'user', content: testSystemPrompt }
              ],
            }),
          });

          if (claudeResponse.ok) {
            const data = await claudeResponse.json();
            testResponse = data.content?.[0]?.text || 'No response generated';
          } else {
            throw new Error('Claude test request failed');
          }
        }

        const processingTime = Date.now() - startTime;

        result = {
          test_result: {
            prompt_used: testPrompt.name,
            test_message,
            response: testResponse,
            processing_time_ms: processingTime,
            provider: provider
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        provider,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in prompt-manager function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to manage prompts',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});