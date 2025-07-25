import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNewsAnalytics } from "@/hooks/useNewsAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Search, 
  ExternalLink, 
  Clock, 
  Bookmark,
  Share2,
  Eye,
  Brain,
  Shield,
  Camera,
  GraduationCap,
  Building2,
  Code,
  Star,
  RefreshCw,
  Activity,
  Users,
  Zap
} from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  published_at: string;
  category_name?: string;
  category_color?: string;
  trending_score?: number;
  engagement_score: number;
  ai_relevance_score?: number;
}

interface NewsCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "AI Development": Brain,
  "Politics & Security": Shield,
  "AI Cameras & Analytics": Camera,
  "School Safety": GraduationCap,
  "Business Applications": Building2,
  "Coding LLMs": Code,
  "JJP Solutions Tech": Star,
};

export default function NewsPage() {
  const [trendingArticles, setTrendingArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoryArticles, setCategoryArticles] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { analytics, loading: analyticsLoading, refreshAnalytics, triggerNewsAggregation, updateIntelligenceScores } = useNewsAnalytics();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory !== "all") {
      loadCategoryArticles(selectedCategory);
    }
  }, [selectedCategory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load trending articles
      const { data: trending, error: trendingError } = await supabase
        .rpc('get_trending_articles', { limit_count: 3 });
      
      if (trendingError) throw trendingError;
      setTrendingArticles(trending || []);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('news_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (categoriesError) throw categoriesError;
      
      const categoriesWithIcons = categoriesData?.map(cat => ({
        ...cat,
        icon: categoryIcons[cat.name] || Brain
      })) || [];
      
      setCategories(categoriesWithIcons);

      // Log page view
      await logInteraction('news_page_view', null, 'page_view');
      
    } catch (error) {
      console.error('Error loading news data:', error);
      toast({
        title: "Error Loading News",
        description: "Failed to load news articles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryArticles = async (categoryName: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_articles_by_category', { 
          category_name: categoryName,
          limit_count: 10 
        });
      
      if (error) throw error;
      setCategoryArticles(data || []);
    } catch (error) {
      console.error('Error loading category articles:', error);
      toast({
        title: "Error Loading Articles",
        description: "Failed to load category articles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const logInteraction = async (
    actionType: string, 
    articleId: string | null, 
    additionalData: any = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (articleId) {
        await supabase.rpc('log_user_interaction', {
          p_user_id: user.id,
          p_article_id: articleId,
          p_action_type: actionType,
          p_time_spent: 0,
          p_interaction_data: additionalData
        });
      }

      // Also log to conversation logs for learning
      await supabase.from('conversation_logs').insert({
        user_id: user.id,
        conversation_type: 'news_interaction',
        content: `${actionType}: ${articleId || 'general'}`,
        context_data: additionalData
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  const handleArticleClick = async (article: NewsArticle) => {
    await logInteraction('article_click', article.id, {
      title: article.title,
      category: article.category_name,
      source: article.source
    });
    
    if (article.source_url) {
      window.open(article.source_url, '_blank');
    }
  };

  const handleBookmark = async (article: NewsArticle) => {
    await logInteraction('bookmark', article.id, {
      title: article.title,
      category: article.category_name
    });
    
    toast({
      title: "Article Bookmarked",
      description: "Article saved to your bookmarks",
    });
  };

  const handleShare = async (article: NewsArticle) => {
    await logInteraction('share', article.id, {
      title: article.title,
      category: article.category_name
    });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.source_url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(article.source_url || '');
      toast({
        title: "Link Copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  const ArticleCard = ({ article, size = "normal" }: { article: NewsArticle; size?: "normal" | "large" }) => (
    <Card className={`cursor-pointer transition-all hover:shadow-lg ${size === "large" ? "col-span-full" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className="text-xs"
              >
                {article.category_name}
              </Badge>
              {(article.trending_score || 0) > 0.7 && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            <CardTitle 
              className={`${size === "large" ? "text-xl" : "text-lg"} line-clamp-2 hover:text-primary transition-colors`}
              onClick={() => handleArticleClick(article)}
            >
              {article.title}
            </CardTitle>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{article.source}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{new Date(article.published_at).toLocaleDateString()}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {article.summary}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {Math.round(article.engagement_score * 100)}
            </span>
            {article.ai_relevance_score && (
              <span className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                {Math.round(article.ai_relevance_score * 100)}%
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(article);
              }}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleShare(article);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleArticleClick(article)}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AnalyticsPanel = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          News Analytics & Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Articles</span>
            </div>
            <div className="text-2xl font-bold">{analytics.totalArticles}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">User Interactions</span>
            </div>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.totalInteractions}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Avg Engagement</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(analytics.engagementMetrics.avgEngagementScore * 100)}%</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Avg Reading Time</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(analytics.userBehaviorInsights.averageReadingTime)}s</div>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button 
            onClick={triggerNewsAggregation}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh News
          </Button>
          <Button 
            onClick={updateIntelligenceScores}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Update Intelligence
          </Button>
          <Button 
            onClick={async () => {
              await supabase.functions.invoke('seed-news-data');
              await loadInitialData();
              toast({ title: "Sample Data Loaded", description: "News articles have been seeded" });
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Load Sample Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI News Hub</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest AI developments, security insights, and technology trends relevant to JJP Solutions.
        </p>
      </div>

      <AnalyticsPanel />
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Trending Articles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Trending Now</h2>
        </div>
        
        <div className="grid gap-4">
          {trendingArticles.map((article) => (
            <ArticleCard key={article.id} article={article} size="large" />
          ))}
        </div>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.name}>
              <category.icon className="w-4 h-4 mr-1" />
              {category.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <category.icon className="w-5 h-5 text-primary" />
                    {category.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    View Articles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.name} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <category.icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{category.name}</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            {categoryArticles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No articles found in this category yet.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}