
-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create system_prompts table for dynamic prompt management
CREATE TABLE IF NOT EXISTS public.system_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  is_active BOOLEAN NOT NULL DEFAULT false,
  parameters JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

-- Create brain_context table for contextual intelligence
CREATE TABLE IF NOT EXISTS public.brain_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_key TEXT NOT NULL UNIQUE,
  context_data JSONB NOT NULL,
  embedding vector(1536),
  relevance_weights JSONB DEFAULT '{}',
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_interactions table for learning and improvement
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID REFERENCES public.system_prompts(id),
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  ai_provider TEXT NOT NULL,
  context_used JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expand existing ai_memories table with additional fields
ALTER TABLE public.ai_memories 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS relevance_score FLOAT DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON public.system_prompts(is_active, ai_provider);
CREATE INDEX IF NOT EXISTS idx_brain_context_embedding ON public.brain_context USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_brain_context_key ON public.brain_context(context_key);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_provider ON public.ai_interactions(ai_provider, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_feedback ON public.ai_interactions(feedback_score, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_memories_source ON public.ai_memories(source_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_memories_relevance ON public.ai_memories(relevance_score DESC);

-- Enable Row Level Security
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_prompts
CREATE POLICY "Admins can manage system prompts" ON public.system_prompts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active prompts" ON public.system_prompts
  FOR SELECT USING (is_active = true);

-- RLS Policies for brain_context
CREATE POLICY "Admins can manage brain context" ON public.brain_context
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "System can read context for processing" ON public.brain_context
  FOR SELECT USING (true);

-- RLS Policies for ai_interactions
CREATE POLICY "Admins can view all interactions" ON public.ai_interactions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their interactions" ON public.ai_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log interactions" ON public.ai_interactions
  FOR INSERT WITH CHECK (true);

-- Create function to get brain context with similarity search
CREATE OR REPLACE FUNCTION public.get_brain_context(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  context_key text,
  context_data jsonb,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    brain_context.context_key,
    brain_context.context_data,
    (brain_context.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM public.brain_context
  WHERE (brain_context.embedding <=> query_embedding) * -1 + 1 > match_threshold
  ORDER BY brain_context.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create function to update access tracking
CREATE OR REPLACE FUNCTION public.track_context_access(context_key_param text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.brain_context 
  SET 
    access_count = access_count + 1,
    last_accessed = now()
  WHERE context_key = context_key_param;
$$;

-- Create function to get active system prompt
CREATE OR REPLACE FUNCTION public.get_active_prompt(provider_name text DEFAULT 'openai')
RETURNS TABLE (
  id uuid,
  name text,
  prompt_template text,
  parameters jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    system_prompts.id,
    system_prompts.name,
    system_prompts.prompt_template,
    system_prompts.parameters
  FROM public.system_prompts
  WHERE is_active = true 
    AND ai_provider = provider_name
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_system_prompts_updated_at ON public.system_prompts;
CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brain_context_updated_at ON public.brain_context;
CREATE TRIGGER update_brain_context_updated_at
  BEFORE UPDATE ON public.brain_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system prompts
INSERT INTO public.system_prompts (name, prompt_template, ai_provider, is_active, parameters) VALUES
('jarvis_default', 'You are Jarvis, an advanced AI assistant integrated into the JJP Solutions Admin Dashboard. You have access to comprehensive system context and memories to provide intelligent, accurate responses. 

Context Available:
{context}

Current System State:
{system_state}

User Query: {user_input}

Provide helpful, accurate responses based on the available context. Never hallucinate or make up information not present in the context.', 'openai', true, '{"temperature": 0.3, "max_tokens": 2000}'),

('claude_vision', 'You are Vision, the AI brain of the JJP Solutions system. You process information intelligently using your vast contextual memory to provide precise, helpful responses.

Available Context:
{context}

Memory State:
{memory_state}

Query: {user_input}

Respond with intelligence and precision, grounding all answers in the provided context.', 'claude', false, '{"max_tokens": 1500, "temperature": 0.2}');
