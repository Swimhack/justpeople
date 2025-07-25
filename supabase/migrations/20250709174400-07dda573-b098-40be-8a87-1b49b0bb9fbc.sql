
-- Create news categories table
CREATE TABLE public.news_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news articles table
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  category_id UUID REFERENCES public.news_categories(id),
  ai_relevance_score DOUBLE PRECISION DEFAULT 0.5,
  trending_score DOUBLE PRECISION DEFAULT 0.0,
  engagement_score DOUBLE PRECISION DEFAULT 0.0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user reading behavior table
CREATE TABLE public.user_reading_behavior (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'view', 'click', 'bookmark', 'share', 'like', 'comment'
  time_spent INTEGER DEFAULT 0, -- in seconds
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content relevance scores table
CREATE TABLE public.content_relevance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID,
  relevance_score DOUBLE PRECISION NOT NULL,
  reasoning TEXT,
  context_factors JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation logs table for learning
CREATE TABLE public.conversation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  conversation_type TEXT, -- 'news_interaction', 'search_query', 'feedback', 'general'
  content TEXT NOT NULL,
  context_data JSONB DEFAULT '{}',
  sentiment_score DOUBLE PRECISION,
  topics TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_relevance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active news categories" ON public.news_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage news categories" ON public.news_categories
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active news articles" ON public.news_articles
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage news articles" ON public.news_articles
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own reading behavior" ON public.user_reading_behavior
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading behavior" ON public.user_reading_behavior
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reading behavior" ON public.user_reading_behavior
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own relevance scores" ON public.content_relevance_scores
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage relevance scores" ON public.content_relevance_scores
FOR ALL USING (true);

CREATE POLICY "Users can view their own conversation logs" ON public.conversation_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation logs" ON public.conversation_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversation logs" ON public.conversation_logs
FOR SELECT USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_news_articles_category_id ON public.news_articles(category_id);
CREATE INDEX idx_news_articles_trending_score ON public.news_articles(trending_score DESC);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_is_featured ON public.news_articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_user_reading_behavior_user_id ON public.user_reading_behavior(user_id);
CREATE INDEX idx_user_reading_behavior_article_id ON public.user_reading_behavior(article_id);
CREATE INDEX idx_content_relevance_scores_article_id ON public.content_relevance_scores(article_id);
CREATE INDEX idx_conversation_logs_user_id ON public.conversation_logs(user_id);
CREATE INDEX idx_conversation_logs_created_at ON public.conversation_logs(created_at DESC);

-- Create trigger for updating timestamps
CREATE TRIGGER update_news_categories_updated_at
  BEFORE UPDATE ON public.news_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_relevance_scores_updated_at
  BEFORE UPDATE ON public.content_relevance_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default news categories
INSERT INTO public.news_categories (name, description, color) VALUES
('AI Development', 'Latest AI frameworks, tools, and breakthroughs', '#8B5CF6'),
('Politics & Security', 'AI regulations, compliance, and government policy', '#DC2626'),
('AI Cameras & Analytics', 'Computer vision, surveillance technology', '#059669'),
('School Safety', 'School shooting prevention and safety technology', '#EA580C'),
('Business Applications', 'Enterprise AI and automation solutions', '#0EA5E9'),
('Coding LLMs', 'Latest language models for development', '#7C3AED'),
('JJP Solutions Tech', 'Curated technology recommendations for JJP Solutions', '#F59E0B');

-- Create function to get trending articles
CREATE OR REPLACE FUNCTION public.get_trending_articles(limit_count INTEGER DEFAULT 3)
RETURNS TABLE(
  id UUID,
  title TEXT,
  summary TEXT,
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  category_name TEXT,
  category_color TEXT,
  trending_score DOUBLE PRECISION,
  engagement_score DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    a.id,
    a.title,
    a.summary,
    a.source,
    a.source_url,
    a.published_at,
    c.name as category_name,
    c.color as category_color,
    a.trending_score,
    a.engagement_score
  FROM public.news_articles a
  LEFT JOIN public.news_categories c ON a.category_id = c.id
  WHERE a.is_active = true
  ORDER BY a.trending_score DESC, a.published_at DESC
  LIMIT limit_count;
$$;

-- Create function to get articles by category
CREATE OR REPLACE FUNCTION public.get_articles_by_category(category_name TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  title TEXT,
  summary TEXT,
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  ai_relevance_score DOUBLE PRECISION,
  engagement_score DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    a.id,
    a.title,
    a.summary,
    a.source,
    a.source_url,
    a.published_at,
    a.ai_relevance_score,
    a.engagement_score
  FROM public.news_articles a
  LEFT JOIN public.news_categories c ON a.category_id = c.id
  WHERE a.is_active = true AND c.name = category_name
  ORDER BY a.published_at DESC
  LIMIT limit_count;
$$;

-- Create function to log user interaction
CREATE OR REPLACE FUNCTION public.log_user_interaction(
  p_user_id UUID,
  p_article_id UUID,
  p_action_type TEXT,
  p_time_spent INTEGER DEFAULT 0,
  p_interaction_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE SQL
AS $$
  INSERT INTO public.user_reading_behavior (user_id, article_id, action_type, time_spent, interaction_data)
  VALUES (p_user_id, p_article_id, p_action_type, p_time_spent, p_interaction_data);
$$;
