import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, MessageSquare, Calendar, Clock, Tag, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJarvisLocal } from '@/hooks/useJarvisLocal';
import { Conversation, Memory } from '@/lib/jarvis-db';

interface AnalyticsData {
  conversationsByCategory: { category: string; count: number; color: string }[];
  conversationsByDay: { date: string; count: number }[];
  messagesByHour: { hour: number; count: number }[];
  topTags: { tag: string; count: number }[];
  conversationLengths: { length: string; count: number }[];
  memoryGrowth: { date: string; count: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export const ConversationAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);

  const { getAllConversations, getAllMemories } = useJarvisLocal();

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const conversations = await getAllConversations();
        const memories = await getAllMemories();
        
        const analytics = processAnalyticsData(conversations, memories, timeRange);
        setAnalyticsData(analytics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [getAllConversations, getAllMemories, timeRange]);

  const processAnalyticsData = (
    conversations: Conversation[], 
    memories: Memory[], 
    range: string
  ): AnalyticsData => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (range) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setFullYear(2020); // All time
    }

    const filteredConversations = conversations.filter(c => 
      new Date(c.created_at) >= cutoffDate
    );

    // Conversations by category
    const categoryCount = filteredConversations.reduce((acc, conv) => {
      acc[conv.category] = (acc[conv.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conversationsByCategory = Object.entries(categoryCount).map(([category, count], index) => ({
      category,
      count,
      color: COLORS[index % COLORS.length]
    }));

    // Conversations by day
    const dailyCount = filteredConversations.reduce((acc, conv) => {
      const date = new Date(conv.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conversationsByDay = Object.entries(dailyCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Messages by hour
    const hourlyCount = filteredConversations.reduce((acc, conv) => {
      conv.messages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      });
      return acc;
    }, {} as Record<number, number>);

    const messagesByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyCount[hour] || 0
    }));

    // Top tags
    const tagCount = filteredConversations.reduce((acc, conv) => {
      conv.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Conversation lengths
    const lengthBuckets = {
      'Short (1-5 messages)': 0,
      'Medium (6-15 messages)': 0,
      'Long (16-30 messages)': 0,
      'Very Long (31+ messages)': 0,
    };

    filteredConversations.forEach(conv => {
      const messageCount = conv.messages.length;
      if (messageCount <= 5) lengthBuckets['Short (1-5 messages)']++;
      else if (messageCount <= 15) lengthBuckets['Medium (6-15 messages)']++;
      else if (messageCount <= 30) lengthBuckets['Long (16-30 messages)']++;
      else lengthBuckets['Very Long (31+ messages)']++;
    });

    const conversationLengths = Object.entries(lengthBuckets).map(([length, count]) => ({
      length,
      count
    }));

    // Memory growth over time
    const memoryByDay = memories.reduce((acc, memory) => {
      const date = new Date(memory.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let cumulative = 0;
    const memoryGrowth = Object.entries(memoryByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        cumulative += count;
        return { date, count: cumulative };
      });

    return {
      conversationsByCategory,
      conversationsByDay,
      messagesByHour,
      topTags,
      conversationLengths,
      memoryGrowth,
    };
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatHour = (hour: number): string => {
    return hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="h-64 bg-muted animate-pulse rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversation Analytics
            </span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Conversations</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {analyticsData.conversationsByCategory.reduce((sum, cat) => sum + cat.count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Avg. Length</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(
                analyticsData.conversationsByDay.reduce((sum, day) => sum + day.count, 0) /
                Math.max(analyticsData.conversationsByDay.length, 1)
              )} msgs
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Top Category</span>
            </div>
            <div className="text-lg font-bold mt-1 capitalize">
              {analyticsData.conversationsByCategory[0]?.category || 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Memory Items</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {analyticsData.memoryGrowth[analyticsData.memoryGrowth.length - 1]?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.conversationsByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ category, count }) => `${category}: ${count}`}
                >
                  {analyticsData.conversationsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Conversation Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.conversationsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Message Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.messagesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={formatHour} />
                <YAxis />
                <Tooltip labelFormatter={formatHour} />
                <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversation Lengths */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Length Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.conversationLengths} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="length" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Tags */}
      {analyticsData.topTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analyticsData.topTags.map((tag, index) => (
                <Badge 
                  key={tag.tag} 
                  variant={index < 3 ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  {tag.tag} ({tag.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Growth */}
      {analyticsData.memoryGrowth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.memoryGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Line type="monotone" dataKey="count" stroke="#d084d0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};