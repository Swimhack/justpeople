import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SeedDataButton } from "@/components/admin/SeedDataButton";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { MessageFilters } from "@/components/messages/MessageFilters";
import { MessagesList } from "@/components/messages/MessagesList";
import { MessageDetails } from "@/components/messages/MessageDetails";
import { MessageStats } from "@/components/messages/MessageStats";
import { NewMessageDialog } from "@/components/messages/NewMessageDialog";
import { UserPresenceIndicator } from "@/components/messages/UserPresenceIndicator";
import { Message, MediaFile } from "@/types/message";
import { Video } from "lucide-react";

export default function MessagesPage() {
  const {
    messages,
    setMessages,
    reactions,
    typingUsers,
    userPresence,
    loading,
    updatePresence,
    setTyping,
    addReaction,
    removeReaction
  } = useRealtimeMessages();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const { toast } = useToast();
  const { sendMessageNotification } = useMessageNotifications();

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark message as read: " + error.message,
        variant: "destructive",
      });
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_archived: true })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_archived: true } : msg
      ));
      
      toast({
        title: "Success",
        description: "Message archived successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to archive message: " + error.message,
        variant: "destructive",
      });
    }
  };

  const sendReply = async (originalMessage: Message, replyContent: string) => {
    if (!replyContent.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.user?.id,
          recipient_id: originalMessage.sender_id,
          subject: `Re: ${originalMessage.subject}`,
          content: replyContent,
          message_type: 'reply',
          priority: 'normal'
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      // Reply will be automatically added via real-time subscription
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send reply: " + error.message,
        variant: "destructive",
      });
    }
  };

  const sendNewMessage = async (newMessage: {
    recipient_id: string;
    subject: string;
    content: string;
    priority: string;
    attachments: any[];
  }) => {
    if (!newMessage.subject.trim() || !newMessage.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Handle recipient_id - validate UUID format or set to null
      let recipientId = null;
      if (newMessage.recipient_id.trim()) {
        // Basic UUID validation pattern
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(newMessage.recipient_id.trim())) {
          recipientId = newMessage.recipient_id.trim();
        } else {
          toast({
            title: "Error",
            description: "Invalid recipient ID format. Please enter a valid UUID or leave empty for broadcast.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.user?.id,
          recipient_id: recipientId,
          subject: newMessage.subject,
          content: newMessage.content,
          priority: newMessage.priority,
          message_type: 'internal',
          attachments: newMessage.attachments
        });

      if (error) throw error;
      
      // Send notification to recipient(s)
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.user?.id)
        .single();
      
      const senderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
      
      await sendMessageNotification(
        recipientId,
        senderName,
        newMessage.subject,
        newMessage.content,
        newMessage.priority
      );
      
      setNewMessageOpen(false);
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      // New message will be automatically added via real-time subscription
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message: " + error.message,
        variant: "destructive",
      });
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || 
                       (filterType === "unread" && !message.is_read) ||
                       (filterType === "archived" && message.is_archived) ||
                       (filterType === "active" && !message.is_archived);
    
    const matchesPriority = filterPriority === "all" || message.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Real-time Communications Hub</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/dashboard/video'} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Video className="h-4 w-4 mr-2" />
              Quick Video Chat
            </Button>
            <SeedDataButton />
            <NewMessageDialog
              open={newMessageOpen}
              onOpenChange={setNewMessageOpen}
              onSendMessage={sendNewMessage}
            />
          </div>
        </div>
        <p className="text-muted-foreground">
          Manage team communications with real-time updates, typing indicators, and instant video calls
        </p>
      </div>

      {/* Filters and Search */}
      <MessageFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
      />

      {/* Real-time Dashboard */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 grid gap-6 lg:grid-cols-2">
          <MessagesList
            messages={filteredMessages}
            selectedMessage={selectedMessage}
            onSelectMessage={setSelectedMessage}
            onMarkAsRead={markAsRead}
          />
          
          <MessageDetails
            selectedMessage={selectedMessage}
            onArchiveMessage={archiveMessage}
            onSendReply={sendReply}
          />
        </div>
        
        <div className="space-y-6">
          <UserPresenceIndicator />
        </div>
      </div>

      {/* Statistics */}
      <MessageStats messages={messages} />
    </div>
  );
}