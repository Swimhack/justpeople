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

interface UserPreferences {
  userId: string;
  categoryPreferences: Record<string, number>;
  keywordInterests: string[];
  readingPatterns: {
    preferredSources: string[];
    averageReadingTime: number;
    activeTimeRanges: string[];
  };
}

async function analyzeUserBehavior(userId: string): Promise<UserPreferences> {
  try {
    // Get user's reading behavior from the last 30 days
    const { data: behaviors } = await supabase
      .from('user_reading_behavior')
      .select(`
        article_id,
        action_type,
        time_spent,
        created_at,
        news_articles (
          category_id,
          source,
          tags,
          news_categories (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!behaviors) {
      return {
        userId,
        categoryPreferences: {},
        keywordInterests: [],
        readingPatterns: {
          preferredSources: [],
          averageReadingTime: 0,
          activeTimeRanges: []
        }
      };
    }

    // Analyze category preferences
    const categoryScores: Record<string, number> = {};
    const sourceEngagement: Record<string, number> = {};
    const timeSpent: number[] = [];
    const hourlyActivity: Record<number, number> = {};

    for (const behavior of behaviors) {
      const article = behavior.news_articles;
      if (!article) continue;

      const categoryName = article.news_categories?.name;
      if (categoryName) {
        categoryScores[categoryName] = (categoryScores[categoryName] || 0) + getActionWeight(behavior.action_type);
      }

      // Track source preferences
      sourceEngagement[article.source] = (sourceEngagement[article.source] || 0) + getActionWeight(behavior.action_type);

      // Track reading time
      if (behavior.time_spent > 0) {
        timeSpent.push(behavior.time_spent);
      }

      // Track hourly activity
      const hour = new Date(behavior.created_at).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    }

    // Calculate average reading time
    const avgReadingTime = timeSpent.length > 0 ? timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length : 0;

    // Find most active time ranges
    const activeTimeRanges = Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${parseInt(hour) + 1}:00`);

    // Get preferred sources
    const preferredSources = Object.entries(sourceEngagement)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([source]) => source);

    // Extract keyword interests from user interactions
    const keywordInterests = await extractKeywordInterests(userId);

    return {
      userId,
      categoryPreferences: categoryScores,
      keywordInterests,
      readingPatterns: {
        preferredSources,
        averageReadingTime: avgReadingTime,
        activeTimeRanges
      }
    };
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    throw error;
  }
}

function getActionWeight(actionType: string): number {
  switch (actionType) {
    case 'view': return 1;
    case 'click': return 3;
    case 'bookmark': return 5;
    case 'share': return 7;
    case 'like': return 4;
    case 'comment': return 6;
    default: return 1;
  }
}

async function extractKeywordInterests(userId: string): Promise<string[]> {
  try {
    // Get conversation logs to understand user interests
    const { data: conversations } = await supabase
      .from('conversation_logs')
      .select('content, context_data')
      .eq('user_id', userId)
      .eq('conversation_type', 'news_interaction')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!conversations) return [];

    const keywords = new Set<string>();
    const keywordCounts: Record<string, number> = {};

    for (const conv of conversations) {
      const content = conv.content.toLowerCase();
      const contextData = conv.context_data || {};
      
      // Extract keywords from context data
      if (contextData.title) {
        extractKeywordsFromText(contextData.title, keywordCounts);
      }
      if (contextData.category) {
        keywordCounts[contextData.category.toLowerCase()] = (keywordCounts[contextData.category.toLowerCase()] || 0) + 2;
      }
      
      // Extract keywords from content
      extractKeywordsFromText(content, keywordCounts);
    }

    // Return top keywords
    return Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword]) => keyword);
  } catch (error) {
    console.error('Error extracting keyword interests:', error);
    return [];
  }
}

function extractKeywordsFromText(text: string, keywordCounts: Record<string, number>): void {
  // Simple keyword extraction - in production, this would use NLP
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  for (const word of words) {
    if (word.length > 3 && !commonWords.has(word)) {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    }
  }
}

async function generatePersonalizedRecommendations(userId: string): Promise<string[]> {
  try {
    const userPrefs = await analyzeUserBehavior(userId);
    
    // Get articles user hasn't interacted with
    const { data: userInteractions } = await supabase
      .from('user_reading_behavior')
      .select('article_id')
      .eq('user_id', userId);
    
    const interactedArticleIds = new Set(userInteractions?.map(i => i.article_id) || []);
    
    // Get candidate articles
    const { data: articles } = await supabase
      .from('news_articles')
      .select(`
        id,
        title,
        summary,
        source,
        ai_relevance_score,
        trending_score,
        engagement_score,
        tags,
        category_id,
        news_categories (
          name
        )
      `)
      .eq('is_active', true)
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if (!articles) return [];
    
    // Score articles based on user preferences
    const scoredArticles = articles
      .filter(article => !interactedArticleIds.has(article.id))
      .map(article => {
        let score = 0;
        
        // Category preference boost
        const categoryName = article.news_categories?.name;
        if (categoryName && userPrefs.categoryPreferences[categoryName]) {
          score += userPrefs.categoryPreferences[categoryName] * 0.3;
        }
        
        // Source preference boost
        if (userPrefs.readingPatterns.preferredSources.includes(article.source)) {
          score += 0.2;
        }
        
        // Keyword interest boost
        const articleText = `${article.title} ${article.summary}`.toLowerCase();
        for (const keyword of userPrefs.keywordInterests) {
          if (articleText.includes(keyword)) {
            score += 0.1;
          }
        }
        
        // Base article scores
        score += article.ai_relevance_score * 0.3;
        score += article.trending_score * 0.2;
        score += article.engagement_score * 0.1;
        
        return { ...article, personalizedScore: score };
      })
      .sort((a, b) => b.personalizedScore - a.personalizedScore);
    
    return scoredArticles.slice(0, 10).map(article => article.id);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

async function analyzeConversationContext(userId: string): Promise<any> {
  try {
    const { data: conversations } = await supabase
      .from('conversation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!conversations || conversations.length === 0) {
      return { insights: [], patterns: [], recommendations: [] };
    }
    
    // Analyze conversation patterns
    const topicFrequency: Record<string, number> = {};
    const sentimentTrend: number[] = [];
    const interactionTypes: Record<string, number> = {};
    
    for (const conv of conversations) {
      // Track conversation types
      interactionTypes[conv.conversation_type] = (interactionTypes[conv.conversation_type] || 0) + 1;
      
      // Track sentiment if available
      if (conv.sentiment_score) {
        sentimentTrend.push(conv.sentiment_score);
      }
      
      // Track topics
      if (conv.topics) {
        for (const topic of conv.topics) {
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        }
      }
    }
    
    // Generate insights
    const insights = [
      `User has ${conversations.length} recorded interactions`,
      `Most common interaction: ${Object.entries(interactionTypes).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'}`,
      `Top interests: ${Object.entries(topicFrequency).sort(([,a], [,b]) => b - a).slice(0, 3).map(([topic]) => topic).join(', ')}`
    ];
    
    return {
      insights,
      patterns: {
        topicFrequency,
        sentimentTrend,
        interactionTypes
      },
      recommendations: await generatePersonalizedRecommendations(userId)
    };
  } catch (error) {
    console.error('Error analyzing conversation context:', error);
    return { insights: [], patterns: [], recommendations: [] };
  }
}

async function updateContentRelevanceScores(): Promise<void> {
  try {
    // Get all articles from the last 30 days
    const { data: articles } = await supabase
      .from('news_articles')
      .select('id, title, summary, content, tags')
      .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    if (!articles) return;
    
    // Get all users with recent activity
    const { data: activeUsers } = await supabase
      .from('user_reading_behavior')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .group('user_id');
    
    if (!activeUsers) return;
    
    // Calculate relevance scores for each user-article pair
    for (const user of activeUsers) {
      const userPrefs = await analyzeUserBehavior(user.user_id);
      
      for (const article of articles) {
        const relevanceScore = calculateArticleRelevance(article, userPrefs);
        
        // Save or update relevance score
        await supabase
          .from('content_relevance_scores')
          .upsert({
            article_id: article.id,
            user_id: user.user_id,
            relevance_score: relevanceScore,
            reasoning: `Based on user preferences and behavior patterns`,
            context_factors: {
              categoryMatch: userPrefs.categoryPreferences,
              keywordMatch: userPrefs.keywordInterests
            }
          });
      }
    }
  } catch (error) {
    console.error('Error updating content relevance scores:', error);
  }
}

function calculateArticleRelevance(article: any, userPrefs: UserPreferences): number {
  let score = 0;
  
  // Check keyword matches
  const articleText = `${article.title} ${article.summary}`.toLowerCase();
  for (const keyword of userPrefs.keywordInterests) {
    if (articleText.includes(keyword)) {
      score += 0.15;
    }
  }
  
  // Check tag matches
  if (article.tags) {
    for (const tag of article.tags) {
      if (userPrefs.keywordInterests.includes(tag.toLowerCase())) {
        score += 0.1;
      }
    }
  }
  
  return Math.min(score, 1.0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { action, userId } = await req.json();
    
    switch (action) {
      case 'analyze-user':
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const userAnalysis = await analyzeUserBehavior(userId);
        return new Response(JSON.stringify(userAnalysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      case 'get-recommendations':
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const recommendations = await generatePersonalizedRecommendations(userId);
        return new Response(JSON.stringify({ recommendations }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      case 'analyze-conversations':
        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const conversationAnalysis = await analyzeConversationContext(userId);
        return new Response(JSON.stringify(conversationAnalysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      case 'update-relevance-scores':
        await updateContentRelevanceScores();
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
    console.error('Error in news-intelligence function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});