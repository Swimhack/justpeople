import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { 
  Bell, 
  MessageSquare, 
  X, 
  Eye, 
  EyeOff,
  Volume2,
  VolumeX,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'new_message' | 'reaction' | 'mention';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  messageId?: string;
}

export const MessageNotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { messages, reactions } = useRealtimeMessages();

  // Add notification when new message is received
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[0];
      const notification: Notification = {
        id: `msg-${latestMessage.id}`,
        type: 'new_message',
        title: 'New Message',
        description: `${latestMessage.subject} - ${latestMessage.content.substring(0, 50)}...`,
        timestamp: latestMessage.created_at,
        read: false,
        messageId: latestMessage.id
      };

      setNotifications(prev => {
        // Check if we already have this notification
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        
        // Play notification sound
        if (soundEnabled) {
          playNotificationSound();
        }
        
        return [notification, ...prev.slice(0, 9)]; // Keep only 10 notifications
      });
    }
  }, [messages, soundEnabled]);

  // Add notification when new reaction is received
  useEffect(() => {
    if (reactions.length > 0) {
      const latestReaction = reactions[reactions.length - 1];
      const notification: Notification = {
        id: `reaction-${latestReaction.id}`,
        type: 'reaction',
        title: 'New Reaction',
        description: `Someone reacted to your message with ${latestReaction.reaction_type}`,
        timestamp: latestReaction.created_at,
        read: false,
        messageId: latestReaction.message_id
      };

      setNotifications(prev => {
        // Check if we already have this notification
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        
        return [notification, ...prev.slice(0, 9)];
      });
    }
  }, [reactions]);

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message': return <MessageSquare className="h-4 w-4" />;
      case 'reaction': return <span className="text-sm">👍</span>;
      case 'mention': return <span className="text-sm">@</span>;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Disable sound" : "Enable sound"}
                >
                  {soundEnabled ? 
                    <Volume2 className="h-3 w-3" /> : 
                    <VolumeX className="h-3 w-3" />
                  }
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <EyeOff className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  title="Clear all"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};