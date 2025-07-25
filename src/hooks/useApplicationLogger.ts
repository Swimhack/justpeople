import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  source?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export const useApplicationLogger = () => {
  // Generate a session ID for this browser session
  const sessionId = sessionStorage.getItem('app-session-id') || 
    crypto.randomUUID();

  useEffect(() => {
    if (!sessionStorage.getItem('app-session-id')) {
      sessionStorage.setItem('app-session-id', sessionId);
    }
  }, [sessionId]);

  const log = useCallback(async (entry: LogEntry) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store logs locally if not authenticated, could implement offline sync later
        console.log('Not authenticated, storing log locally:', entry);
        return;
      }

      await supabase.functions.invoke('application-logs', {
        body: {
          level: entry.level,
          message: entry.message,
          source: entry.source,
          stackTrace: entry.stackTrace,
          metadata: entry.metadata,
          sessionId: entry.sessionId || sessionId,
        },
      });
    } catch (error) {
      console.error('Failed to log application event:', error);
    }
  }, [sessionId]);

  const logError = useCallback((message: string, error?: Error, source?: string, metadata?: Record<string, any>) => {
    log({
      level: 'error',
      message,
      source,
      stackTrace: error?.stack,
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message,
      },
    });
  }, [log]);

  const logWarning = useCallback((message: string, source?: string, metadata?: Record<string, any>) => {
    log({
      level: 'warn',
      message,
      source,
      metadata,
    });
  }, [log]);

  const logInfo = useCallback((message: string, source?: string, metadata?: Record<string, any>) => {
    log({
      level: 'info',
      message,
      source,
      metadata,
    });
  }, [log]);

  const logDebug = useCallback((message: string, source?: string, metadata?: Record<string, any>) => {
    log({
      level: 'debug',
      message,
      source,
      metadata,
    });
  }, [log]);

  // Get logs via URL (for agent consumption)
  const getLogsUrl = useCallback(async (filters?: {
    level?: LogLevel;
    source?: string;
    format?: 'json' | 'text';
    limit?: number;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required to access logs');
    }

    const baseUrl = `https://khpxxilvraavgartihvl.supabase.co/functions/v1/application-logs`;
    const params = new URLSearchParams();
    
    if (filters?.level) params.append('level', filters.level);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.format) params.append('format', filters.format);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `${baseUrl}?${params.toString()}`;
    
    return {
      url,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocHh4aWx2cmFhdmdhcnRpaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMzQ1MDQsImV4cCI6MjA2NzYxMDUwNH0.ovqvMBxI86Ao0yEHWhi6CYKVTZsKxL-Sdl737mDhDMc',
      },
    };
  }, []);

  return {
    log,
    logError,
    logWarning,
    logInfo,
    logDebug,
    getLogsUrl,
    sessionId,
  };
};

// Global error handler
export const setupGlobalErrorLogging = () => {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    const logger = useApplicationLogger();
    logger.logError(
      'Unhandled error',
      event.error,
      'global',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const logger = useApplicationLogger();
    logger.logError(
      'Unhandled promise rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'global',
      {
        type: 'unhandledrejection',
        reason: event.reason,
      }
    );
  });
};