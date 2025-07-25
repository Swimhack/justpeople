import { useEffect } from 'react';
import { useUserActivityLogger } from '@/hooks/useUserActivityLogger';

export const ActivityTracker = () => {
  const { logActivity } = useUserActivityLogger();

  useEffect(() => {
    // Log session start
    logActivity({
      activityType: 'session_start',
      category: 'system',
      description: 'User session started',
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    });

    // Log session end on page unload
    const handleBeforeUnload = () => {
      logActivity({
        activityType: 'session_end',
        category: 'system',
        description: 'User session ended',
        metadata: {
          timestamp: new Date().toISOString(),
          sessionDuration: Date.now() - performance.timeOrigin
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [logActivity]);

  return null; // This component doesn't render anything
};