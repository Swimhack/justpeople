import React, { useState } from 'react';
import { Save, TestTube, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotifications, NotificationPreference } from '@/hooks/useNotifications';

export const NotificationPreferences: React.FC = () => {
  const { preferences, loading, updatePreference, sendTestNotification } = useNotifications();
  const [phoneNumber, setPhoneNumber] = useState('');

  const notificationTypes = [
    {
      key: 'message',
      name: 'Messages',
      description: 'New messages from other users',
      icon: '💬',
    },
    {
      key: 'mention',
      name: 'Mentions',
      description: 'When someone mentions you',
      icon: '@',
    },
    {
      key: 'reaction',
      name: 'Reactions',
      description: 'When someone reacts to your messages',
      icon: '👍',
    },
    {
      key: 'system',
      name: 'System Alerts',
      description: 'Important system notifications',
      icon: '⚠️',
    },
    {
      key: 'security',
      name: 'Security',
      description: 'Security-related notifications',
      icon: '🔒',
    },
  ];

  const channels = [
    { key: 'email_enabled', name: 'Email', icon: '📧' },
    { key: 'sms_enabled', name: 'SMS', icon: '📱' },
    { key: 'push_enabled', name: 'Browser Push', icon: '🔔' },
    { key: 'in_app_enabled', name: 'In-App', icon: '💬' },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
  ];

  const getPreference = (notificationType: string): NotificationPreference | undefined => {
    return preferences.find(p => p.notification_type === notificationType);
  };

  const handleChannelToggle = (notificationType: string, channel: string, enabled: boolean) => {
    updatePreference(notificationType, { [channel]: enabled });
  };

  const handlePriorityChange = (notificationType: string, priority: string) => {
    updatePreference(notificationType, { priority_level: priority });
  };

  const handleQuietHoursChange = (notificationType: string, field: string, value: string) => {
    updatePreference(notificationType, { [field]: value });
  };

  const handleTimezoneChange = (notificationType: string, timezone: string) => {
    updatePreference(notificationType, { timezone });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-10 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <p className="text-muted-foreground">
            Customize how and when you receive notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={requestNotificationPermission}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Enable Browser Notifications
          </Button>
          <Button
            onClick={sendTestNotification}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Send Test Notification
          </Button>
        </div>
      </div>

      {/* Global SMS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 SMS Settings
          </CardTitle>
          <CardDescription>
            Configure your phone number for SMS notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <Button variant="outline" className="mt-6">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Type Settings */}
      {notificationTypes.map((type) => {
        const pref = getPreference(type.key);
        if (!pref) return null;

        return (
          <Card key={type.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">{type.icon}</span>
                {type.name}
                <Badge variant="outline" className="ml-auto">
                  {pref.priority_level}
                </Badge>
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel Toggles */}
              <div>
                <h4 className="font-medium mb-3">Delivery Channels</h4>
                <div className="grid grid-cols-2 gap-4">
                  {channels.map((channel) => (
                    <div
                      key={channel.key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>{channel.icon}</span>
                        <Label>{channel.name}</Label>
                      </div>
                      <Switch
                        checked={pref[channel.key as keyof NotificationPreference] as boolean}
                        onCheckedChange={(checked) =>
                          handleChannelToggle(type.key, channel.key, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Priority and Timing Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <span>⚡</span>
                    Priority Level
                  </Label>
                  <Select
                    value={pref.priority_level}
                    onValueChange={(value) => handlePriorityChange(type.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    Quiet Hours Start
                  </Label>
                  <Input
                    type="time"
                    value={pref.quiet_hours_start || ''}
                    onChange={(e) =>
                      handleQuietHoursChange(type.key, 'quiet_hours_start', e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    Quiet Hours End
                  </Label>
                  <Input
                    type="time"
                    value={pref.quiet_hours_end || ''}
                    onChange={(e) =>
                      handleQuietHoursChange(type.key, 'quiet_hours_end', e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" />
                  Timezone
                </Label>
                <Select
                  value={pref.timezone}
                  onValueChange={(value) => handleTimezoneChange(type.key, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};