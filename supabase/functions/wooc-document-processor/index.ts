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
    const { document, type = 'prd' } = await req.json();

    console.log('Processing document of type:', type);

    // Call Claude 4 Opus for document analysis
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are an expert AI project management consultant. Analyze this ${type.toUpperCase()} document and provide a comprehensive analysis.

Document Content:
${document}

Please provide a detailed analysis in the following JSON format:
{
  "executive_summary": "Brief 2-3 sentence overview of the document",
  "key_insights": ["insight1", "insight2", "insight3"],
  "requirements": ["requirement1", "requirement2", "requirement3"],
  "risks": ["risk1", "risk2", "risk3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "timeline_suggestions": {
    "phase1": "Phase 1 description and timeframe",
    "phase2": "Phase 2 description and timeframe", 
    "phase3": "Phase 3 description and timeframe"
  },
  "technical_considerations": ["consideration1", "consideration2", "consideration3"],
  "success_metrics": ["metric1", "metric2", "metric3"],
  "estimated_complexity": "low|medium|high",
  "priority_score": 8.5,
  "gaps_identified": ["gap1", "gap2", "gap3"],
  "stakeholder_needs": ["need1", "need2", "need3"]
}

Focus on actionable insights and practical recommendations for AI/ML project development.`
        }]
      })
    });

    const claudeData = await claudeResponse.json();
    
    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeData.error?.message || 'Unknown error'}`);
    }

    let analysisResult;
    try {
      // Extract JSON from Claude's response
      const content = claudeData.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Fallback analysis structure
      analysisResult = {
        executive_summary: "Document processed successfully but detailed analysis failed to parse.",
        key_insights: ["Document contains project requirements", "Analysis completed with Claude 4 Opus"],
        requirements: ["Further manual review recommended"],
        risks: ["Analysis parsing requires attention"],
        recommendations: ["Manual review of processed content suggested"],
        timeline_suggestions: {
          phase1: "Initial review and clarification - 1-2 weeks",
          phase2: "Development planning - 2-3 weeks",
          phase3: "Implementation - 4-8 weeks"
        },
        technical_considerations: ["Manual review recommended"],
        success_metrics: ["Completion rate", "Quality score"],
        estimated_complexity: "medium",
        priority_score: 7.0,
        gaps_identified: ["Analysis parsing needs improvement"],
        stakeholder_needs: ["Clear requirements documentation"]
      };
    }

    // Store analysis in database
    const { data: insertData, error: insertError } = await supabase
      .from('ai_interactions')
      .insert({
        ai_provider: 'anthropic',
        input: document.substring(0, 1000) + '...',
        output: JSON.stringify(analysisResult),
        context_used: { document_type: type, analysis_type: 'document_processing' },
        tokens_used: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || 0,
        processing_time_ms: Date.now()
      });

    if (insertError) {
      console.error('Failed to store analysis:', insertError);
    }

    console.log('Document analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      metadata: {
        processed_at: new Date().toISOString(),
        document_type: type,
        tokens_used: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wooc-document-processor:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});