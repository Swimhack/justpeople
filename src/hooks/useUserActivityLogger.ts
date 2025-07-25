import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApplicationLogger } from './useApplicationLogger';

export type ActivityCategory = 
  | 'authentication' 
  | 'navigation' 
  | 'interaction' 
  | 'communication' 
  | 'file_management'
  | 'system'
  | 'security';

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset'
  | 'page_visit'
  | 'route_change'
  | 'button_click'
  | 'form_submit'
  | 'message_send'
  | 'message_read'
  | 'file_upload'
  | 'file_download'
  | 'video_call_start'
  | 'video_call_join'
  | 'profile_update'
  | 'settings_change'
  | 'search'
  | 'session_start'
  | 'session_end'
  | 'feature_usage';

interface ActivityLog {
  activityType: ActivityType;
  category: ActivityCategory;
  description: string;
  metadata?: Record<string, any>;
  duration?: number;
}

export const useUserActivityLogger = () => {
  let location;
  try {
    location = useLocation();
  } catch (error) {
    // Handle case where hook is called outside router context
    location = { pathname: '/' };
  }
  
  const { logInfo } = useApplicationLogger();
  const pageStartTime = useRef<number>(Date.now());
  const currentRoute = useRef<string>(location.pathname);

  // Track page visits and route changes
  useEffect(() => {
    const previousRoute = currentRoute.current;
    const newRoute = location.pathname;
    
    if (previousRoute !== newRoute) {
      // Log time spent on previous page
      if (previousRoute) {
        const timeSpent = Date.now() - pageStartTime.current;
        logActivity({
          activityType: 'page_visit',
          category: 'navigation',
          description: `Visited page: ${previousRoute}`,
          metadata: { 
            route: previousRoute,
            timeSpent: Math.round(timeSpent / 1000), // seconds
            exitedTo: newRoute
          },
          duration: timeSpent
        });
      }

      // Log new page visit
      logActivity({
        activityType: 'route_change',
        category: 'navigation',
        description: `Navigated to: ${newRoute}`,
        metadata: { 
          route: newRoute,
          previousRoute,
          timestamp: new Date().toISOString()
        }
      });

      currentRoute.current = newRoute;
      pageStartTime.current = Date.now();
    }
  }, [location.pathname]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logActivity({
          activityType: 'page_visit',
          category: 'navigation',
          description: 'Page became hidden',
          metadata: { 
            route: location.pathname,
            visibility: 'hidden'
          }
        });
      } else {
        logActivity({
          activityType: 'page_visit',
          category: 'navigation',
          description: 'Page became visible',
          metadata: { 
            route: location.pathname,
            visibility: 'visible'
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location.pathname]);

  const logActivity = useCallback(async (activity: ActivityLog) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store activity locally for unauthenticated users if needed
        console.log('Activity logged (unauthenticated):', activity);
        return;
      }

      // Use application logger for consistent logging
      logInfo(
        `User activity: ${activity.description}`,
        'activity_tracker',
        {
          activityType: activity.activityType,
          category: activity.category,
          duration: activity.duration,
          route: location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...activity.metadata
        }
      );

      // Also send to dedicated activity tracking endpoint
      await supabase.functions.invoke('application-logs', {
        body: {
          level: 'info',
          message: `Activity: ${activity.activityType} - ${activity.description}`,
          source: 'user_activity',
          metadata: {
            activityType: activity.activityType,
            category: activity.category,
            duration: activity.duration,
            route: location.pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            ...activity.metadata
          }
        }
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }, [location.pathname, logInfo]);

  // Convenience methods for common activities
  const logAuthentication = useCallback((type: 'login' | 'logout' | 'signup' | 'password_reset', metadata?: Record<string, any>) => {
    logActivity({
      activityType: type,
      category: 'authentication',
      description: `User ${type}`,
      metadata
    });
  }, [logActivity]);

  const logInteraction = useCallback((element: string, action: string, metadata?: Record<string, any>) => {
    logActivity({
      activityType: 'button_click',
      category: 'interaction',
      description: `${action} on ${element}`,
      metadata: { element, action, ...metadata }
    });
  }, [logActivity]);

  const logFormSubmission = useCallback((formName: string, success: boolean, metadata?: Record<string, any>) => {
    logActivity({
      activityType: 'form_submit',
      category: 'interaction',
      description: `Form submitted: ${formName} (${success ? 'success' : 'failed'})`,
      metadata: { formName, success, ...metadata }
    });
  }, [logActivity]);

  const logCommunication = useCallback((action: 'send' | 'read', type: 'message' | 'email', metadata?: Record<string, any>) => {
    logActivity({
      activityType: action === 'send' ? 'message_send' : 'message_read',
      category: 'communication',
      description: `${action} ${type}`,
      metadata: { action, type, ...metadata }
    });
  }, [logActivity]);

  const logFileOperation = useCallback((operation: 'upload' | 'download', filename: string, metadata?: Record<string, any>) => {
    logActivity({
      activityType: operation === 'upload' ? 'file_upload' : 'file_download',
      category: 'file_management',
      description: `File ${operation}: ${filename}`,
      metadata: { operation, filename, ...metadata }
    });
  }, [logActivity]);

  const logVideoCall = useCallback((action: 'start' | 'join', roomId: string, metadata?: Record<string, any>) => {
    logActivity({
      activityType: action === 'start' ? 'video_call_start' : 'video_call_join',
      category: 'communication',
      description: `Video call ${action}: ${roomId}`,
      metadata: { action, roomId, ...metadata }
    });
  }, [logActivity]);

  const logProfileUpdate = useCallback((field: string, metadata?: Record<string, any>) => {
    logActivity({
      activityType: 'profile_update',
      category: 'interaction',
      description: `Profile updated: ${field}`,
      metadata: { field, ...metadata }
    });
  }, [logActivity]);

  const logSettingsChange = useCallback((setting: string, value: any, metadata?: Record<string, any>) => {
    logActivity({
      activityType: 'settings_change',
      category: 'interaction',
      description: `Settings changed: ${setting}`,
      metadata: { setting, value, ...metadata }
    });
  }, [logActivity]);

  const logSearch = useCallback((query: string, results?: number, metadata?: Record<string, any>) => {
    logActivity({
      activityType: 'search',
      category: 'interaction',
      description: `Search performed: "${query}"`,
      metadata: { query, results, ...metadata }
    });
  }, [logActivity]);

  const logFeatureUsage = useCallback((feature: string, metadata?: Record<string, any>) => {
    logActivity({
      activityType: 'feature_usage',
      category: 'interaction',
      description: `Feature used: ${feature}`,
      metadata: { feature, ...metadata }
    });
  }, [logActivity]);

  return {
    logActivity,
    logAuthentication,
    logInteraction,
    logFormSubmission,
    logCommunication,
    logFileOperation,
    logVideoCall,
    logProfileUpdate,
    logSettingsChange,
    logSearch,
    logFeatureUsage
  };
};