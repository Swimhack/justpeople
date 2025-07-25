import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityState {
  sessionId: string | null;
  lastActivity: Date;
  accountLocked: boolean;
  lockoutUntil: Date | null;
  failedAttempts: number;
}

interface LoginAttempt {
  identifier: string;
  success: boolean;
  attemptType?: string;
  metadata?: Record<string, any>;
}

export const useSecurityManager = () => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    sessionId: null,
    lastActivity: new Date(),
    accountLocked: false,
    lockoutUntil: null,
    failedAttempts: 0,
  });
  const { toast } = useToast();

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  // Check account lockout status
  const checkAccountLockout = useCallback(async (identifier: string) => {
    try {
      const { data, error } = await supabase.rpc('check_account_lockout', {
        p_identifier: identifier,
        p_max_attempts: 5,
        p_lockout_minutes: 15
      });

      if (error) throw error;

      const lockoutResult = data as { locked: boolean; attempts: number; lockout_until?: string; message?: string };

      setSecurityState(prev => ({
        ...prev,
        accountLocked: lockoutResult.locked,
        lockoutUntil: lockoutResult.locked && lockoutResult.lockout_until ? new Date(lockoutResult.lockout_until) : null,
        failedAttempts: lockoutResult.attempts
      }));

      return lockoutResult;
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return { locked: false, attempts: 0 };
    }
  }, []);

  // Log login attempt
  const logLoginAttempt = useCallback(async (attempt: LoginAttempt) => {
    try {
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase
        .from('login_attempts')
        .insert({
          identifier: attempt.identifier,
          user_id: attempt.success ? (await supabase.auth.getUser()).data.user?.id : null,
          attempt_type: attempt.attemptType || 'password',
          success: attempt.success,
          user_agent: userAgent,
          metadata: attempt.metadata || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }, []);

  // Create user session
  const createUserSession = useCallback(async (userId: string) => {
    try {
      const sessionId = generateSessionId();
      const userAgent = navigator.userAgent;

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          user_agent: userAgent,
          is_active: true,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });

      if (error) throw error;

      setSecurityState(prev => ({
        ...prev,
        sessionId,
        lastActivity: new Date()
      }));

      return sessionId;
    } catch (error) {
      console.error('Error creating user session:', error);
      return null;
    }
  }, [generateSessionId]);

  // Update session activity
  const updateSessionActivity = useCallback(async () => {
    if (!securityState.sessionId) return;

    try {
      await supabase.rpc('update_session_activity', {
        p_session_id: securityState.sessionId
      });

      setSecurityState(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }, [securityState.sessionId]);

  // Terminate session
  const terminateSession = useCallback(async (sessionId?: string) => {
    try {
      const targetSessionId = sessionId || securityState.sessionId;
      if (!targetSessionId) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_id', targetSessionId);

      if (error) throw error;

      if (!sessionId || sessionId === securityState.sessionId) {
        setSecurityState(prev => ({
          ...prev,
          sessionId: null,
          lastActivity: new Date()
        }));
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }, [securityState.sessionId]);

  // Get active sessions for user
  const getActiveSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }, []);

  // Detect security anomalies
  const detectAnomalies = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('detect_security_anomalies');
      
      if (error) throw error;

      // Show toast for high severity anomalies
      const highSeverityAnomalies = data?.filter(a => a.severity === 'high') || [];
      if (highSeverityAnomalies.length > 0) {
        toast({
          title: "Security Alert",
          description: `${highSeverityAnomalies.length} high-severity security anomalies detected`,
          variant: "destructive",
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }, [toast]);

  // Auto-update session activity every 5 minutes
  useEffect(() => {
    if (!securityState.sessionId) return;

    const interval = setInterval(() => {
      updateSessionActivity();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [securityState.sessionId, updateSessionActivity]);

  // Check for session timeout (15 minutes of inactivity)
  useEffect(() => {
    const checkTimeout = () => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - securityState.lastActivity.getTime();
      const timeoutThreshold = 15 * 60 * 1000; // 15 minutes

      if (timeSinceActivity > timeoutThreshold && securityState.sessionId) {
        toast({
          title: "Session Timeout",
          description: "Your session has expired due to inactivity",
          variant: "destructive",
        });
        terminateSession();
      }
    };

    const interval = setInterval(checkTimeout, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [securityState.lastActivity, securityState.sessionId, toast, terminateSession]);

  return {
    securityState,
    checkAccountLockout,
    logLoginAttempt,
    createUserSession,
    updateSessionActivity,
    terminateSession,
    getActiveSessions,
    detectAnomalies,
  };
};