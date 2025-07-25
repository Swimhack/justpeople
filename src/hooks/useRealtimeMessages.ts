import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { Message, MediaFile } from "@/types/message";

// Database message interface (what comes from Supabase)
interface DatabaseMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  is_archived: boolean;
  video_room_id: string | null;
  attachments: Json;
  created_at: string;
  updated_at: string;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

interface TypingIndicator {
  user_id: string;
  recipient_id: string | null;
  is_typing: boolean;
}

interface UserPresence {
  user_id: string;
  status: string;
  last_seen: string;
  custom_status?: string;
}

export const useRealtimeMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Convert database message to typed message
  const convertDbMessage = (dbMessage: DatabaseMessage): Message => {
    let attachments: MediaFile[] = [];
    
    try {
      if (dbMessage.attachments) {
        if (Array.isArray(dbMessage.attachments)) {
          // Cast through unknown for safe type conversion
          attachments = dbMessage.attachments as unknown as MediaFile[];
        } else if (typeof dbMessage.attachments === 'string') {
          attachments = JSON.parse(dbMessage.attachments);
        } else if (typeof dbMessage.attachments === 'object' && dbMessage.attachments !== null) {
          // Handle case where attachments is an object
          attachments = [dbMessage.attachments] as unknown as MediaFile[];
        }
      }
    } catch (error) {
      console.warn('Failed to parse message attachments:', error);
      attachments = [];
    }

    return {
      ...dbMessage,
      attachments
    };
  };

  // Initial data fetch
  const fetchInitialData = async () => {
    try {
      // Fetch messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Fetch reactions
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('message_reactions')
        .select('*');

      if (reactionsError) throw reactionsError;

      // Fetch user presence
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('*');

      if (presenceError) throw presenceError;

      setMessages(messagesData ? messagesData.map(convertDbMessage) : []);
      setReactions(reactionsData || []);
      setUserPresence(presenceData || []);
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load messages: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Messages subscription
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Messages change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = convertDbMessage(payload.new as DatabaseMessage);
            setMessages(prev => [newMessage, ...prev]);
            
            // Show notification for new messages from others
            supabase.auth.getUser().then(({ data: user }) => {
              if (payload.new.sender_id !== user?.user?.id) {
                toast({
                  title: "New Message",
                  description: `New message: ${payload.new.subject}`,
                });
              }
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = convertDbMessage(payload.new as DatabaseMessage);
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? updatedMessage : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Reactions subscription
    const reactionsChannel = supabase
      .channel('reactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          console.log('Reactions change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setReactions(prev => [...prev, payload.new as MessageReaction]);
          } else if (payload.eventType === 'DELETE') {
            setReactions(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Typing indicators subscription
    const typingChannel = supabase
      .channel('typing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        (payload) => {
          console.log('Typing change:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const indicator = payload.new as TypingIndicator;
            if (indicator.is_typing) {
              setTypingUsers(prev => {
                const filtered = prev.filter(t => 
                  !(t.user_id === indicator.user_id && t.recipient_id === indicator.recipient_id)
                );
                return [...filtered, indicator];
              });
            } else {
              setTypingUsers(prev => prev.filter(t => 
                !(t.user_id === indicator.user_id && t.recipient_id === indicator.recipient_id)
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            setTypingUsers(prev => prev.filter(t => 
              !(t.user_id === payload.old.user_id && t.recipient_id === payload.old.recipient_id)
            ));
          }
        }
      )
      .subscribe();

    // User presence subscription
    const presenceChannel = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          console.log('Presence change:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setUserPresence(prev => {
              const filtered = prev.filter(p => p.user_id !== payload.new.user_id);
              return [...filtered, payload.new as UserPresence];
            });
          } else if (payload.eventType === 'DELETE') {
            setUserPresence(prev => prev.filter(p => p.user_id !== payload.old.user_id));
          }
        }
      )
      .subscribe();

    channelsRef.current = [messagesChannel, reactionsChannel, typingChannel, presenceChannel];
  };

  // Update user presence
  const updatePresence = async (status: UserPresence['status'], customStatus?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.user.id,
          status,
          custom_status: customStatus,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating presence:', error);
    }
  };

  // Set typing indicator
  const setTyping = async (isTyping: boolean, recipientId?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: user.user.id,
          recipient_id: recipientId || null,
          is_typing: isTyping,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,recipient_id'
        });

      if (error) throw error;

      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false, recipientId);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error setting typing indicator:', error);
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: string, reactionType: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.user.id,
          reaction_type: reactionType
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // Remove reaction from message
  const removeReaction = async (messageId: string, reactionType: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .match({
          message_id: messageId,
          user_id: user.user.id,
          reaction_type: reactionType
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchInitialData();
    setupRealtimeSubscriptions();

    // Set user as online
    updatePresence('online');

    // Set user as offline when leaving
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup subscriptions
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set user as offline
      updatePresence('offline');
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    messages,
    setMessages,
    reactions,
    typingUsers,
    userPresence,
    loading,
    updatePresence,
    setTyping,
    addReaction,
    removeReaction,
    refetch: fetchInitialData
  };
};