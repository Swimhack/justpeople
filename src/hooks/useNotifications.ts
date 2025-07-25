import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  priority_level: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  status: string;
  subject?: string;
  content: string;
  metadata: any;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('notification_type');

      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch user notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      
      // Count unread notifications
      const unread = data?.filter(n => !n.read_at).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update notification preference
  const updatePreference = useCallback(async (
    notificationType: string,
    updates: Partial<NotificationPreference>
  ) => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('notification_type', notificationType);

      if (error) throw error;
      
      await fetchPreferences();
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    }
  }, [fetchPreferences, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (error) throw error;
      
      await fetchNotifications();
      toast({
        title: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  }, [fetchNotifications, toast]);

  // Register device for push notifications
  const registerDevice = useCallback(async (token: string, deviceType: string = 'web') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: user.id,
          token,
          device_type: deviceType,
          browser_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
          last_used: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('notification-engine', {
        body: {
          action: 'send_test',
          notification_type: 'system',
          priority: 'normal',
        },
      });

      if (error) throw error;
      
      toast({
        title: "Test Notification Sent",
        description: "Check your enabled notification channels",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchPreferences();
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs'
        },
        (payload) => {
          const newNotification = payload.new as NotificationLog;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.subject || 'New Notification', {
              body: newNotification.content,
              icon: '/favicon.ico',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPreferences, fetchNotifications]);

  return {
    preferences,
    notifications,
    unreadCount,
    loading,
    updatePreference,
    markAsRead,
    markAllAsRead,
    registerDevice,
    sendTestNotification,
    refetch: () => {
      fetchPreferences();
      fetchNotifications();
    },
  };
};