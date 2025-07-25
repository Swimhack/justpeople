import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsAnalytics {
  totalArticles: number;
  categoryDistribution: Record<string, number>;
  engagementMetrics: {
    totalInteractions: number;
    avgEngagementScore: number;
    topPerformingCategories: string[];
  };
  userBehaviorInsights: {
    averageReadingTime: number;
    mostActiveHours: number[];
    topInterests: string[];
  };
}

export function useNewsAnalytics() {
  const [analytics, setAnalytics] = useState<NewsAnalytics>({
    totalArticles: 0,
    categoryDistribution: {},
    engagementMetrics: {
      totalInteractions: 0,
      avgEngagementScore: 0,
      topPerformingCategories: []
    },
    userBehaviorInsights: {
      averageReadingTime: 0,
      mostActiveHours: [],
      topInterests: []
    }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get total articles and category distribution
      const { data: articles } = await supabase
        .from('news_articles')
        .select(`
          id,
          engagement_score,
          category_id,
          news_categories (
            name
          )
        `)
        .eq('is_active', true);
      
      if (!articles) throw new Error('Failed to load articles');
      
      const totalArticles = articles.length;
      const categoryDistribution: Record<string, number> = {};
      let totalEngagement = 0;
      
      articles.forEach(article => {
        const categoryName = article.news_categories?.name || 'Unknown';
        categoryDistribution[categoryName] = (categoryDistribution[categoryName] || 0) + 1;
        totalEngagement += article.engagement_score;
      });
      
      const avgEngagementScore = totalArticles > 0 ? totalEngagement / totalArticles : 0;
      
      // Get top performing categories
      const topPerformingCategories = Object.entries(categoryDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);
      
      // Get user behavior insights
      const { data: behaviors } = await supabase
        .from('user_reading_behavior')
        .select('time_spent, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const totalInteractions = behaviors?.length || 0;
      const averageReadingTime = behaviors?.length > 0 
        ? behaviors.reduce((sum, b) => sum + (b.time_spent || 0), 0) / behaviors.length
        : 0;
      
      // Calculate most active hours
      const hourlyActivity: Record<number, number> = {};
      behaviors?.forEach(behavior => {
        const hour = new Date(behavior.created_at).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });
      
      const mostActiveHours = Object.entries(hourlyActivity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));
      
      // Get top interests from conversation logs
      const { data: conversations } = await supabase
        .from('conversation_logs')
        .select('topics')
        .eq('conversation_type', 'news_interaction')
        .not('topics', 'is', null);
      
      const topicFrequency: Record<string, number> = {};
      conversations?.forEach(conv => {
        conv.topics?.forEach((topic: string) => {
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        });
      });
      
      const topInterests = Object.entries(topicFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);
      
      setAnalytics({
        totalArticles,
        categoryDistribution,
        engagementMetrics: {
          totalInteractions,
          avgEngagementScore,
          topPerformingCategories
        },
        userBehaviorInsights: {
          averageReadingTime,
          mostActiveHours,
          topInterests
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load news analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerNewsAggregation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('news-aggregator', {
        body: { action: 'aggregate' }
      });
      
      if (error) throw error;
      
      toast({
        title: "News Aggregation Started",
        description: `Processing ${data.articlesProcessed} articles`,
      });
      
      // Refresh analytics after aggregation
      setTimeout(() => loadAnalytics(), 2000);
    } catch (error) {
      console.error('Error triggering aggregation:', error);
      toast({
        title: "Aggregation Error",
        description: "Failed to start news aggregation",
        variant: "destructive",
      });
    }
  };

  const updateIntelligenceScores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.functions.invoke('news-intelligence', {
        body: { action: 'update-relevance-scores' }
      });
      
      if (error) throw error;
      
      toast({
        title: "Intelligence Update Started",
        description: "Updating content relevance scores",
      });
    } catch (error) {
      console.error('Error updating intelligence:', error);
      toast({
        title: "Intelligence Error",
        description: "Failed to update intelligence scores",
        variant: "destructive",
      });
    }
  };

  return {
    analytics,
    loading,
    refreshAnalytics: loadAnalytics,
    triggerNewsAggregation,
    updateIntelligenceScores
  };
}