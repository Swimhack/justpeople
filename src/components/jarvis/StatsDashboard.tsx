import React, { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Brain, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useJarvisMCP } from '@/hooks/useJarvisMCP';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalConversations: number;
  totalMessages: number;
  memoryCount: number;
  lastActivity: string;
  tokenUsage?: {
    total: number;
    thisMonth: number;
  };
}

export const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { getStats, isLoading } = useJarvisMCP();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getStats();
      if (statsData) {
        setStats(statsData);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon: Icon, description, badge }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description?: string;
    badge?: string;
  }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">{formatNumber(Number(value))}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading && !stats) {
    return (
      <Card className="h-full bg-background border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            JARVIS Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-background border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            JARVIS Analytics
          </CardTitle>
          <Button
            onClick={loadStats}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-input"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {stats ? (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Total Conversations"
                value={stats.totalConversations}
                icon={MessageSquare}
                description="All-time conversations"
                badge="Active"
              />
              
              <StatCard
                title="Total Messages"
                value={stats.totalMessages}
                icon={Activity}
                description="Messages exchanged"
              />
              
              <StatCard
                title="Memory Entries"
                value={stats.memoryCount}
                icon={Brain}
                description="Stored memories"
              />
              
              <StatCard
                title="Token Usage"
                value={stats.tokenUsage?.thisMonth || 0}
                icon={TrendingUp}
                description="This month"
                badge="Monthly"
              />
            </div>

            {/* Activity Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-foreground">Last Activity</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.lastActivity ? formatDate(stats.lastActivity) : 'No recent activity'}
                    </span>
                  </div>

                  {stats.tokenUsage && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-foreground">Total Token Usage</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatNumber(stats.tokenUsage.total)} tokens
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-foreground">Avg. Messages per Conversation</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalConversations > 0 
                        ? Math.round(stats.totalMessages / stats.totalConversations)
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium text-foreground">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-xs text-green-600 font-medium">MCP Online</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-xs text-blue-600 font-medium">Memory Active</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                    <p className="text-xs text-purple-600 font-medium">API Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No statistics available</p>
            <p className="text-sm">Unable to load analytics data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};