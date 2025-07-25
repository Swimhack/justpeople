import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Send notification when a new message is created
  const sendMessageNotification = useCallback(async (
    recipientId: string | null, 
    senderName: string,
    messageSubject: string,
    messageContent: string,
    priority: string = 'normal'
  ) => {
    try {
      // If it's a broadcast message (no specific recipient), notify all users
      if (!recipientId) {
        // Get all users to send broadcast notification
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email');

        if (profiles) {
          for (const profile of profiles) {
            // Don't send notification to the sender
            if (profile.user_id === user?.id) continue;

            await supabase.functions.invoke('notification-engine', {
              body: {
                action: 'send',
                user_id: profile.user_id,
                notification_type: 'message',
                priority,
                data: {
                  sender_name: senderName,
                  message_subject: messageSubject,
                  message_preview: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
                  message_url: `${window.location.origin}/dashboard/messages`,
                },
              },
            });
          }
        }
      } else {
        // Send notification to specific recipient
        await supabase.functions.invoke('notification-engine', {
          body: {
            action: 'send',
            user_id: recipientId,
            notification_type: 'message',
            priority,
            data: {
              sender_name: senderName,
              message_subject: messageSubject,
              message_preview: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
              message_url: `${window.location.origin}/dashboard/messages`,
            },
          },
        });
      }

      console.log('Message notification sent successfully');
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }, [user]);

  // Send notification when someone is mentioned
  const sendMentionNotification = useCallback(async (
    mentionedUserId: string,
    mentionedBy: string,
    context: string
  ) => {
    try {
      await supabase.functions.invoke('notification-engine', {
        body: {
          action: 'send',
          user_id: mentionedUserId,
          notification_type: 'mention',
          priority: 'high',
          data: {
            mention_by: mentionedBy,
            mention_context: context,
            message_url: `${window.location.origin}/dashboard/messages`,
          },
        },
      });
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  }, []);

  // Send notification for message reactions
  const sendReactionNotification = useCallback(async (
    messageOwnerId: string,
    reactionBy: string,
    reactionType: string,
    messageSubject: string
  ) => {
    try {
      // Don't send notification if user reacted to their own message
      if (messageOwnerId === user?.id) return;

      await supabase.functions.invoke('notification-engine', {
        body: {
          action: 'send',
          user_id: messageOwnerId,
          notification_type: 'reaction',
          priority: 'low',
          data: {
            reaction_by: reactionBy,
            reaction_type: reactionType,
            message_subject: messageSubject,
            message_url: `${window.location.origin}/dashboard/messages`,
          },
        },
      });
    } catch (error) {
      console.error('Error sending reaction notification:', error);
    }
  }, [user]);

  // Set up real-time listeners for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Show browser notification if the user has them enabled
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`New message from ${newMessage.sender_name || 'Unknown'}`, {
              body: newMessage.subject,
              icon: '/favicon.ico',
              tag: 'new-message',
            });

            // Auto-close notification after 5 seconds
            setTimeout(() => notification.close(), 5000);
          }

          // Show toast notification
          toast({
            title: "New Message",
            description: `${newMessage.subject} from ${newMessage.sender_name || 'Unknown'}`,
          });

          // Trigger haptic feedback on mobile devices
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const reaction = payload.new;
          
          // Show toast for reactions on user's messages
          toast({
            title: "Message Reaction",
            description: `Someone reacted with ${reaction.reaction_type} to your message`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return {
    sendMessageNotification,
    sendMentionNotification,
    sendReactionNotification,
  };
};