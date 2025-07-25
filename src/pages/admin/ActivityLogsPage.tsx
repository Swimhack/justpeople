import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Download, Search, Filter, User, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string | null;
  level: string;
  message: string;
  source: string | null;
  metadata: any;
  timestamp: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: '',
    source: '',
    activityType: '',
    category: '',
    userId: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('application_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.search) {
        query = query.ilike('message', `%${filters.search}%`);
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Additional client-side filtering for metadata fields
      let filteredData = data || [];
      
      if (filters.activityType) {
        filteredData = filteredData.filter(log => {
          const metadata = log.metadata as any;
          return metadata?.activityType === filters.activityType;
        });
      }
      
      if (filters.category) {
        filteredData = filteredData.filter(log => {
          const metadata = log.metadata as any;
          return metadata?.category === filters.category;
        });
      }

      setLogs(filteredData);
    } catch (error: any) {
      toast.error('Failed to load activity logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const handleExport = async () => {
    try {
      const csvContent = [
        'Timestamp,User ID,Level,Activity Type,Category,Message,Source,Metadata',
        ...logs.map(log => 
          `"${log.timestamp}","${log.user_id || ''}","${log.level}","${(log.metadata as any)?.activityType || ''}","${(log.metadata as any)?.category || ''}","${log.message}","${log.source || ''}","${JSON.stringify(log.metadata || {})}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Activity logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const resetFilters = () => {
    setFilters({
      level: '',
      source: '',
      activityType: '',
      category: '',
      userId: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'navigation': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'interaction': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'communication': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'file_management': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor and analyze user activity across the application
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter activity logs by various criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Message</Label>
                <Input
                  id="search"
                  placeholder="Search in messages..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Log Level</Label>
                <Select value={filters.level} onValueChange={(value) => setFilters({...filters, level: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="user_activity">User Activity</SelectItem>
                    <SelectItem value="activity_tracker">Activity Tracker</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityType">Activity Type</Label>
                <Select value={filters.activityType} onValueChange={(value) => setFilters({...filters, activityType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="signup">Signup</SelectItem>
                    <SelectItem value="page_visit">Page Visit</SelectItem>
                    <SelectItem value="route_change">Route Change</SelectItem>
                    <SelectItem value="button_click">Button Click</SelectItem>
                    <SelectItem value="form_submit">Form Submit</SelectItem>
                    <SelectItem value="message_send">Message Send</SelectItem>
                    <SelectItem value="file_upload">File Upload</SelectItem>
                    <SelectItem value="video_call_start">Video Call Start</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                    <SelectItem value="interaction">Interaction</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="file_management">File Management</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Filter by user ID..."
                  value={filters.userId}
                  onChange={(e) => setFilters({...filters, userId: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <Button variant="outline" onClick={resetFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading activity logs...
                </div>
              </CardContent>
            </Card>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No activity logs found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card 
                key={log.id} 
                className={`cursor-pointer transition-colors hover:bg-accent ${selectedLog?.id === log.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        {(log.metadata as any)?.activityType && (
                          <Badge variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {(log.metadata as any).activityType}
                          </Badge>
                        )}
                        {(log.metadata as any)?.category && (
                          <Badge className={getCategoryColor((log.metadata as any).category)}>
                            {(log.metadata as any).category}
                          </Badge>
                        )}
                        {log.user_id && (
                          <Badge variant="secondary">
                            <User className="h-3 w-3 mr-1" />
                            {log.user_id.slice(-8)}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="font-medium">{log.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                        {log.source && (
                          <span>Source: {log.source}</span>
                        )}
                        {(log.metadata as any)?.route && (
                          <span>Route: {(log.metadata as any).route}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          {selectedLog && (
            <Card>
              <CardHeader>
                <CardTitle>Log Details</CardTitle>
                <CardDescription>Detailed information about the selected log entry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Message</Label>
                  <p className="text-sm">{selectedLog.message}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm">{format(new Date(selectedLog.timestamp), 'MMM dd, yyyy HH:mm:ss')}</p>
                </div>
                
                {selectedLog.user_id && (
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-sm font-mono">{selectedLog.user_id}</p>
                  </div>
                )}
                
                {selectedLog.source && (
                  <div>
                    <Label className="text-sm font-medium">Source</Label>
                    <p className="text-sm">{selectedLog.source}</p>
                  </div>
                )}
                
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Metadata</Label>
                    <Textarea
                      value={JSON.stringify(selectedLog.metadata, null, 2)}
                      readOnly
                      className="font-mono text-xs h-32"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Quick overview of recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Logs:</span>
                  <span className="text-sm font-medium">{logs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Errors:</span>
                  <span className="text-sm font-medium text-destructive">
                    {logs.filter(log => log.level === 'error').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Warnings:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {logs.filter(log => log.level === 'warn').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unique Users:</span>
                  <span className="text-sm font-medium">
                    {new Set(logs.filter(log => log.user_id).map(log => log.user_id)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}