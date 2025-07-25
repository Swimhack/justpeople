import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Contact, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalContent: number;
  totalMessages: number;
  totalContacts: number;
  recentActivity: Array<{ date: string; count: number }>;
  pendingTasks: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'content' | 'message' | 'contact';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [
        profilesResult,
        contentResult,
        messagesResult,
        contactsResult,
        analyticsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at').order('created_at', { ascending: false }),
        supabase.from('content').select('id, title, status, created_at').order('created_at', { ascending: false }),
        supabase.from('messages').select('id, subject, created_at').order('created_at', { ascending: false }),
        supabase.from('contacts').select('id, name, status, created_at').order('created_at', { ascending: false }),
        supabase.from('analytics_events').select('created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      // Process activity chart data
      const activityData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEvents = analyticsResult.data?.filter(
          (event) => event.created_at.startsWith(dateStr)
        ).length || 0;
        
        activityData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: dayEvents,
        });
      }

      // Calculate stats
      const dashboardStats: DashboardStats = {
        totalUsers: profilesResult.data?.length || 0,
        totalContent: contentResult.data?.length || 0,
        totalMessages: messagesResult.data?.length || 0,
        totalContacts: contactsResult.data?.length || 0,
        recentActivity: activityData,
        pendingTasks: contactsResult.data?.filter(c => c.status === 'new').length || 0,
        systemHealth: 98, // Mock system health percentage
      };

      setStats(dashboardStats);

      // Generate recent activity items
      const activities: RecentActivity[] = [];
      
      // Add recent users
      profilesResult.data?.slice(0, 2).forEach((profile) => {
        activities.push({
          id: `user-${profile.id}`,
          type: 'user',
          description: 'New user registered',
          timestamp: profile.created_at,
          status: 'success',
        });
      });

      // Add recent content
      contentResult.data?.slice(0, 2).forEach((content) => {
        activities.push({
          id: `content-${content.id}`,
          type: 'content',
          description: `Content "${content.title}" was ${content.status}`,
          timestamp: content.created_at,
          status: content.status === 'published' ? 'success' : 'warning',
        });
      });

      // Add recent messages
      messagesResult.data?.slice(0, 2).forEach((message) => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message',
          description: `New message: "${message.subject}"`,
          timestamp: message.created_at,
          status: 'success',
        });
      });

      // Sort by timestamp and take most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return Users;
      case 'content': return FileText;
      case 'message': return MessageSquare;
      case 'contact': return Contact;
      default: return Activity;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return Clock;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin control center</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activity Overview
            </CardTitle>
            <CardDescription>Daily activity for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis className="text-muted-foreground" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const StatusIcon = getStatusIcon(activity.status);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-3 w-3 ${getStatusColor(activity.status)}`} />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">System Health</span>
                <span className="text-sm text-muted-foreground">{stats.systemHealth}%</span>
              </div>
              <Progress value={stats.systemHealth} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Database Performance</span>
                <span className="text-sm text-muted-foreground">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="ghost">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <FileText className="h-4 w-4 mr-2" />
              Create Content
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <MessageSquare className="h-4 w-4 mr-2" />
              View Messages
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics Report
            </Button>
            <Button className="w-full justify-start" variant="ghost" asChild>
              <a href="/admin/logs">
                <Activity className="h-4 w-4 mr-2" />
                Application Logs
              </a>
            </Button>
            
            {stats.pendingTasks > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Tasks</span>
                  <Badge variant="secondary">{stats.pendingTasks}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You have {stats.pendingTasks} pending contact(s) to review
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}