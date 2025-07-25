import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  activeAnomalies: number;
  recentFailedLogins: number;
  highSeverityEvents: number;
  securityScore: number;
}

interface SecurityReport {
  timestamp: string;
  status: 'ok' | 'warning' | 'critical';
  metrics: SecurityMetrics;
  anomalies: any[];
  recentEvents: any[];
  failedLoginSummary: {
    total: number;
    uniqueIPs: number;
    uniqueEmails: number;
  };
}

export const useSecurityMonitoring = () => {
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch security monitoring data
  const fetchSecurityReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions
        .invoke('security-monitor', {
          method: 'POST'
        });

      if (functionError) throw functionError;

      setSecurityReport(data);

      // Show toast for critical status
      if (data.status === 'critical') {
        toast({
          title: "🚨 Critical Security Alert",
          description: `Security score: ${data.metrics.securityScore}/100. Immediate attention required.`,
          variant: "destructive",
        });
      } else if (data.status === 'warning') {
        toast({
          title: "⚠️ Security Warning",
          description: `Security score: ${data.metrics.securityScore}/100. Review recommended.`,
          variant: "default",
        });
      }

    } catch (err: any) {
      console.error('Error fetching security report:', err);
      setError(err.message || 'Failed to fetch security report');
      toast({
        title: "Security Monitoring Error",
        description: "Failed to fetch security report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get user sessions for admin view
  const getUserSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }, []);

  // Get login attempts for analysis
  const getLoginAttempts = useCallback(async (timeframe: 'hour' | 'day' | 'week' = 'day') => {
    try {
      const timeMap = {
        hour: 1,
        day: 24,
        week: 24 * 7
      };

      const hoursAgo = timeMap[timeframe];
      const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      return [];
    }
  }, []);

  // Terminate a specific user session (admin only)
  const terminateUserSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      if (error) throw error;

      toast({
        title: "Session Terminated",
        description: "User session has been terminated successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error terminating session:', error);
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Block user account (admin only)
  const blockUserAccount = useCallback(async (userId: string, reason: string) => {
    try {
      // Terminate all active sessions for the user
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (sessionError) throw sessionError;

      // Log the blocking action
      await supabase.rpc('log_security_event', {
        event_type: 'user_account_blocked',
        user_id: userId,
        details: {
          reason,
          blocked_by: (await supabase.auth.getUser()).data.user?.id,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: "Account Blocked",
        description: "User account has been blocked and all sessions terminated",
      });

      return true;
    } catch (error: any) {
      console.error('Error blocking user account:', error);
      toast({
        title: "Error",
        description: "Failed to block user account",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Auto-refresh security data every 30 seconds
  useEffect(() => {
    fetchSecurityReport();
    
    const interval = setInterval(() => {
      fetchSecurityReport();
    }, 30 * 1000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchSecurityReport]);

  // Real-time security event subscription
  useEffect(() => {
    const channel = supabase
      .channel('security-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_logs',
          filter: 'resource_type=eq.security_event'
        },
        () => {
          // Refresh security report when new security events occur
          fetchSecurityReport();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_attempts',
          filter: 'success=eq.false'
        },
        () => {
          // Refresh on failed login attempts
          fetchSecurityReport();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSecurityReport]);

  return {
    securityReport,
    loading,
    error,
    fetchSecurityReport,
    getUserSessions,
    getLoginAttempts,
    terminateUserSession,
    blockUserAccount,
  };
};