import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  Activity,
  Lock,
  Eye,
  Ban
} from 'lucide-react';

export const SecurityDashboard = () => {
  const { 
    securityReport, 
    loading, 
    error, 
    fetchSecurityReport,
    getUserSessions,
    getLoginAttempts,
    terminateUserSession,
    blockUserAccount
  } = useSecurityMonitoring();
  const { toast } = useToast();
  
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hour' | 'day' | 'week'>('day');

  useEffect(() => {
    const loadData = async () => {
      const [sessions, attempts] = await Promise.all([
        getUserSessions(),
        getLoginAttempts(selectedTimeframe)
      ]);
      setActiveSessions(sessions);
      setLoginAttempts(attempts);
    };
    
    loadData();
  }, [getUserSessions, getLoginAttempts, selectedTimeframe]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <XCircle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    const success = await terminateUserSession(sessionId);
    if (success) {
      setActiveSessions(prev => prev.filter(s => s.session_id !== sessionId));
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    const success = await blockUserAccount(userId, reason);
    if (success) {
      setActiveSessions(prev => prev.filter(s => s.user_id !== userId));
    }
  };

  if (loading && !securityReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading security data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security Dashboard Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={fetchSecurityReport}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      {securityReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className={`h-4 w-4 ${getStatusColor(securityReport.status)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityReport.metrics.securityScore}/100</div>
              <Progress value={securityReport.metrics.securityScore} className="mt-2" />
              <p className="text-xs text-muted-foreground flex items-center mt-2">
                {getStatusIcon(securityReport.status)}
                <span className="ml-1 capitalize">{securityReport.status}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityReport.metrics.activeAnomalies}</div>
              <p className="text-xs text-muted-foreground">
                {securityReport.metrics.highSeverityEvents} high severity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <Lock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityReport.metrics.recentFailedLogins}</div>
              <p className="text-xs text-muted-foreground">
                Last hour: {securityReport.failedLoginSummary.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Unique users active
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Status Alert */}
      {securityReport?.status === 'critical' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Critical Security Alert</AlertTitle>
          <AlertDescription>
            {securityReport.metrics.highSeverityEvents} high-severity security events detected. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {securityReport?.status === 'warning' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Warning</AlertTitle>
          <AlertDescription>
            {securityReport.metrics.activeAnomalies} security anomalies detected. 
            Review recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anomalies">Security Anomalies</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="logins">Login Attempts</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Anomalies</CardTitle>
              <CardDescription>
                Real-time security anomaly detection and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityReport?.anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No anomalies detected</p>
                  <p className="text-muted-foreground">Your system is operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityReport?.anomalies.map((anomaly, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{anomaly.anomaly_type.replace(/_/g, ' ').toUpperCase()}</h4>
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <pre className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {JSON.stringify(anomaly.details, null, 2)}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        Detected: {new Date(anomaly.detected_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Monitor and manage active user sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {session.profiles?.first_name} {session.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last activity: {new Date(session.last_activity).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        User Agent: {session.user_agent?.slice(0, 50)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTerminateSession(session.session_id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Terminate
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBlockUser(session.user_id, 'Admin action')}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Block User
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Login Attempts</CardTitle>
                <CardDescription>
                  Monitor authentication attempts and identify suspicious activity
                </CardDescription>
              </div>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as 'hour' | 'day' | 'week')}
                className="px-3 py-1 border rounded-md"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loginAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <p className="font-medium">{attempt.identifier}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {attempt.ip_address || 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={attempt.success ? 'default' : 'destructive'}>
                      {attempt.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Audit log of security-related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {securityReport?.recentEvents.map((event) => (
                  <div key={event.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{event.action.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                    {event.metadata && (
                      <pre className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};