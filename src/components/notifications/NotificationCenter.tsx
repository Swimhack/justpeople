import React from 'react';
import { Bell, Check, CheckCheck, Settings, Volume2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  onOpenPreferences?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onOpenPreferences,
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    sendTestNotification,
  } = useNotifications();

  const handleNotificationClick = (notificationId: string, hasBeenRead: boolean) => {
    if (!hasBeenRead) {
      markAsRead(notificationId);
    }
  };

  const playNotificationSound = () => {
    if ('AudioContext' in window) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      case 'push':
        return '🔔';
      default:
        return '💬';
    }
  };

  const getPriorityColor = (metadata: any) => {
    const priority = metadata?.priority || 'normal';
    switch (priority) {
      case 'urgent':
        return 'bg-destructive';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Notifications
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={playNotificationSound}
                title="Test notification sound"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendTestNotification}
                title="Send test notification"
              >
                <Bell className="h-4 w-4" />
              </Button>
              {onOpenPreferences && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenPreferences}
                  title="Notification settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up! No new notifications.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {unreadCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {unreadCount} unread
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="h-8"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            </div>
          )}

          <Separator />

          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const isRead = !!notification.read_at;
                  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  });

                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        !isRead ? 'bg-muted/20 border-primary/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id, isRead)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {getChannelIcon(notification.channel)}
                            </span>
                            {notification.subject && (
                              <p className={`font-medium text-sm truncate ${
                                !isRead ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.subject}
                              </p>
                            )}
                            <div
                              className={`w-2 h-2 rounded-full ${getPriorityColor(
                                notification.metadata
                              )}`}
                            />
                          </div>
                          <p className={`text-sm ${
                            !isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {timeAgo}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0"
                            >
                              {notification.notification_type}
                            </Badge>
                          </div>
                        </div>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};