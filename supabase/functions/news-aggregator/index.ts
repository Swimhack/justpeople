import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface NewsSource {
  name: string;
  url: string;
  apiKey?: string;
  category: string;
}

const newsSources: NewsSource[] = [
  {
    name: "AI News",
    url: "https://newsapi.org/v2/everything?q=artificial%20intelligence&sortBy=publishedAt&pageSize=10",
    apiKey: Deno.env.get('NEWS_API_KEY'),
    category: "AI Development"
  },
  {
    name: "Security News",
    url: "https://newsapi.org/v2/everything?q=cybersecurity%20AI&sortBy=publishedAt&pageSize=10",
    apiKey: Deno.env.get('NEWS_API_KEY'),
    category: "Politics & Security"
  },
  {
    name: "Computer Vision",
    url: "https://newsapi.org/v2/everything?q=computer%20vision%20AI%20camera&sortBy=publishedAt&pageSize=10",
    apiKey: Deno.env.get('NEWS_API_KEY'),
    category: "AI Cameras & Analytics"
  },
  {
    name: "School Safety",
    url: "https://newsapi.org/v2/everything?q=school%20safety%20technology&sortBy=publishedAt&pageSize=10",
    apiKey: Deno.env.get('NEWS_API_KEY'),
    category: "School Safety"
  },
  {
    name: "Business AI",
    url: "https://newsapi.org/v2/everything?q=business%20AI%20automation&sortBy=publishedAt&pageSize=10",
    apiKey: Deno.env.get('NEWS_API_KEY'),
    category: "Business Applications"
  },
  {
    name: "Coding LLMs",
    url: "https://newsapi.org/v2/everything?q=coding%20LLM%20programming%20AI&sortBy=publishedAt&pageSize=10",
    apiKey: Deno.env.get('NEWS_API_KEY'),
    category: "Coding LLMs"
  }
];

async function fetchNewsFromAPI(source: NewsSource): Promise<any[]> {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'JJP-Solutions-News-Aggregator/1.0'
    };
    
    if (source.apiKey) {
      headers['X-API-Key'] = source.apiKey;
    }
    
    const response = await fetch(source.url, { headers });
    
    if (!response.ok) {
      console.error(`Failed to fetch from ${source.name}:`, response.status);
      return [];
    }
    
    const data = await response.json();
    
    return data.articles?.map((article: any) => ({
      title: article.title,
      content: article.content,
      summary: article.description,
      source: source.name,
      source_url: article.url,
      published_at: article.publishedAt,
      category: source.category,
      metadata: {
        author: article.author,
        urlToImage: article.urlToImage,
        originalSource: article.source?.name
      }
    })) || [];
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
}

async function calculateAIRelevanceScore(article: any): Promise<number> {
  // Simple keyword-based relevance scoring
  const aiKeywords = [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
    'computer vision', 'natural language processing', 'automation', 'robotics',
    'algorithm', 'data science', 'predictive analytics', 'AI model', 'LLM',
    'chatbot', 'security', 'surveillance', 'school safety', 'threat detection'
  ];
  
  const text = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
  let score = 0;
  let matches = 0;
  
  for (const keyword of aiKeywords) {
    if (text.includes(keyword)) {
      matches++;
      score += 0.1;
    }
  }
  
  // Special boost for JJP Solutions relevant content
  const jjpKeywords = ['school', 'safety', 'security', 'surveillance', 'camera', 'analytics'];
  for (const keyword of jjpKeywords) {
    if (text.includes(keyword)) {
      score += 0.15;
    }
  }
  
  return Math.min(score, 1.0);
}

async function calculateTrendingScore(article: any): Promise<number> {
  const publishedAt = new Date(article.published_at);
  const now = new Date();
  const hoursAgo = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  // Recency boost (higher score for newer articles)
  let score = Math.max(0, 1 - (hoursAgo / 24)); // Decay over 24 hours
  
  // Boost for trending keywords
  const trendingKeywords = ['breakthrough', 'new', 'latest', 'revolutionary', 'breakthrough'];
  const text = `${article.title} ${article.summary}`.toLowerCase();
  
  for (const keyword of trendingKeywords) {
    if (text.includes(keyword)) {
      score += 0.2;
    }
  }
  
  return Math.min(score, 1.0);
}

async function saveArticleToDatabase(article: any): Promise<void> {
  try {
    // Get category ID
    const { data: categories } = await supabase
      .from('news_categories')
      .select('id')
      .eq('name', article.category)
      .single();
    
    if (!categories) {
      console.error(`Category not found: ${article.category}`);
      return;
    }
    
    // Check if article already exists
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('source_url', article.source_url)
      .maybeSingle();
    
    if (existing) {
      console.log(`Article already exists: ${article.title}`);
      return;
    }
    
    const aiRelevanceScore = await calculateAIRelevanceScore(article);
    const trendingScore = await calculateTrendingScore(article);
    
    const { error } = await supabase
      .from('news_articles')
      .insert({
        title: article.title,
        content: article.content,
        summary: article.summary,
        source: article.source,
        source_url: article.source_url,
        published_at: article.published_at,
        category_id: categories.id,
        ai_relevance_score: aiRelevanceScore,
        trending_score: trendingScore,
        engagement_score: 0.1, // Default engagement score
        metadata: article.metadata,
        is_active: true
      });
    
    if (error) {
      console.error('Error saving article:', error);
    } else {
      console.log(`Saved article: ${article.title}`);
    }
  } catch (error) {
    console.error('Error in saveArticleToDatabase:', error);
  }
}

async function aggregateNews(): Promise<{ success: boolean; articlesProcessed: number }> {
  console.log('Starting news aggregation...');
  let totalArticles = 0;
  
  for (const source of newsSources) {
    try {
      console.log(`Fetching from ${source.name}...`);
      const articles = await fetchNewsFromAPI(source);
      
      for (const article of articles) {
        if (article.title && article.source_url) {
          await saveArticleToDatabase(article);
          totalArticles++;
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${source.name}:`, error);
    }
  }
  
  // Update engagement scores based on user behavior
  await updateEngagementScores();
  
  console.log(`News aggregation completed. Processed ${totalArticles} articles.`);
  return { success: true, articlesProcessed: totalArticles };
}

async function updateEngagementScores(): Promise<void> {
  try {
    // Get articles with recent user interactions
    const { data: interactions } = await supabase
      .from('user_reading_behavior')
      .select('article_id, action_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (!interactions) return;
    
    // Calculate engagement scores
    const engagementMap = new Map<string, number>();
    
    for (const interaction of interactions) {
      const currentScore = engagementMap.get(interaction.article_id) || 0;
      let scoreBoost = 0;
      
      switch (interaction.action_type) {
        case 'view': scoreBoost = 0.1; break;
        case 'click': scoreBoost = 0.3; break;
        case 'bookmark': scoreBoost = 0.5; break;
        case 'share': scoreBoost = 0.7; break;
        case 'like': scoreBoost = 0.4; break;
      }
      
      engagementMap.set(interaction.article_id, currentScore + scoreBoost);
    }
    
    // Update articles with new engagement scores
    for (const [articleId, score] of engagementMap) {
      await supabase
        .from('news_articles')
        .update({ engagement_score: Math.min(score, 1.0) })
        .eq('id', articleId);
    }
  } catch (error) {
    console.error('Error updating engagement scores:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { action } = await req.json().catch(() => ({ action: 'aggregate' }));
    
    switch (action) {
      case 'aggregate':
        const result = await aggregateNews();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      case 'update-engagement':
        await updateEngagementScores();
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in news-aggregator function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});