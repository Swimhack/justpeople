import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

export interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    subscription: null,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { registerDevice } = useNotifications();

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setState(prev => ({ ...prev, isSupported }));
    return isSupported;
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!checkSupport()) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribeToNotifications();
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications were not enabled",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkSupport, toast]);

  // Subscribe to push notifications
  const subscribeToNotifications = useCallback(async () => {
    if (!checkSupport() || state.permission !== 'granted') {
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // This would be your VAPID public key in production
          'BPh_6Q_YdGm1j7rQ8QKhN3PGvP9wUzQ5sV7hY2jk9Cp6gOmL2mS7QlN4iG8mR7xP3bJ2vF1nO6sB4hD9kM8qL5w'
        ),
      });

      setState(prev => ({ ...prev, subscription, isSubscribed: true }));

      // Register the device token with our backend
      await registerDevice(JSON.stringify(subscription), 'web');

      return subscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to subscribe to push notifications",
        variant: "destructive",
      });
      return null;
    }
  }, [checkSupport, state.permission, registerDevice, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return false;

    try {
      await state.subscription.unsubscribe();
      setState(prev => ({ 
        ...prev, 
        subscription: null, 
        isSubscribed: false 
      }));

      toast({
        title: "Unsubscribed",
        description: "Push notifications have been disabled",
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from notifications",
        variant: "destructive",
      });
      return false;
    }
  }, [state.subscription, toast]);

  // Show a local notification (for testing)
  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first",
        variant: "destructive",
      });
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }, [state.permission, toast]);

  // Initialize on mount
  useEffect(() => {
    if (checkSupport()) {
      setState(prev => ({ 
        ...prev, 
        permission: Notification.permission 
      }));

      // Check if already subscribed
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setState(prev => ({ 
            ...prev, 
            subscription, 
            isSubscribed: true 
          }));
        }
      });
    }
  }, [checkSupport]);

  return {
    ...state,
    loading,
    requestPermission,
    subscribeToNotifications,
    unsubscribe,
    showLocalNotification,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}