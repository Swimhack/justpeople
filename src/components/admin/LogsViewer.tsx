import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useApplicationLogger } from '@/hooks/useApplicationLogger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface ApplicationLog {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source?: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
  session_id?: string;
}

export const LogsViewer = () => {
  const [logs, setLogs] = useState<ApplicationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    source: '',
    limit: 100,
  });
  const [logsUrl, setLogsUrl] = useState<string>('');
  
  const { getLogsUrl } = useApplicationLogger();
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('application_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(filters.limit);

      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setLogs((data || []) as ApplicationLog[]);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLogsUrl = async () => {
    try {
      const { url } = await getLogsUrl({
        level: filters.level as LogLevel || undefined,
        source: filters.source || undefined,
        format: 'text',
        limit: filters.limit,
      });
      setLogsUrl(url);
    } catch (error) {
      console.error('Error generating logs URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate logs URL',
        variant: 'destructive',
      });
    }
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(logsUrl);
    toast({
      title: 'Copied',
      description: 'Logs URL copied to clipboard',
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  useEffect(() => {
    generateLogsUrl();
  }, [filters, getLogsUrl]);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Logs</CardTitle>
          <CardDescription>
            View and filter application logs. Generate URLs for agent consumption.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Log Level</label>
              <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
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
            
            <div className="flex-1">
              <label className="text-sm font-medium">Source</label>
              <Input
                placeholder="Filter by source"
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              />
            </div>
            
            <div className="w-24">
              <label className="text-sm font-medium">Limit</label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 100 }))}
              />
            </div>
            
            <Button onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* URL for Agent */}
          {logsUrl && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Logs URL for Agent</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyUrlToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={logsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </a>
                  </Button>
                </div>
              </div>
              <code className="text-sm bg-background p-2 rounded border block break-all">
                {logsUrl}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Use this URL in your agent prompts. Include the Authorization header for authentication.
              </p>
            </div>
          )}

          {/* Logs List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    {log.source && (
                      <Badge variant="outline">{log.source}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm">{log.message}</p>
                
                {log.stack_trace && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Stack trace</summary>
                    <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                      {log.stack_trace}
                    </pre>
                  </details>
                )}
                
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Metadata</summary>
                    <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {logs.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No logs found with current filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};