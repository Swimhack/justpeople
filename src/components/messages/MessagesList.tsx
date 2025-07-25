import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { MediaRenderer } from "@/components/messages/MediaRenderer";
import { MessageSquare, Reply, Forward, Archive, Calendar, Circle, Users, Paperclip, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@/types/message";

interface MessagesListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  onMarkAsRead: (messageId: string) => void;
}

export const MessagesList = ({
  messages,
  selectedMessage,
  onSelectMessage,
  onMarkAsRead
}: MessagesListProps) => {
  const { userPresence, typingUsers } = useRealtimeMessages();
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'reply': return <Reply className="h-4 w-4" />;
      case 'forward': return <Forward className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Real-time Messages ({messages.length})
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{userPresence.filter(p => p.status === 'online').length} online</span>
          </div>
        </CardTitle>
        <CardDescription>
          Click on a message to view details and reply • Real-time updates enabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages found
            </p>
          ) : (
            messages.map((message) => {
              const senderPresence = userPresence.find(p => p.user_id === message.sender_id);
              const isOnline = senderPresence?.status === 'online';
              const isTyping = typingUsers.some(t => t.user_id === message.sender_id && t.is_typing);
              
              return (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                    selectedMessage?.id === message.id ? 'bg-accent border-primary' : ''
                  } ${!message.is_read ? 'border-primary shadow-sm' : ''} ${
                    isOnline ? 'ring-1 ring-green-500/20' : ''
                  }`}
                  onClick={() => {
                    onSelectMessage(message);
                    if (!message.is_read) {
                      onMarkAsRead(message.id);
                    }
                  }}
                >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getMessageTypeIcon(message.message_type)}
                      <h4 className={`font-medium truncate ${!message.is_read ? 'text-primary' : ''}`}>
                        {message.subject}
                      </h4>
                      {!message.is_read && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                      <div className="flex items-center gap-1">
                        <Circle className={`h-2 w-2 ${isOnline ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-gray-400 text-gray-400'}`} />
                        {isTyping && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {message.content}
                    </p>
                    
                    {/* Multimedia preview */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2">
                        <MediaRenderer attachments={message.attachments} compact={true} />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      {message.attachments && message.attachments.length > 0 && (
                        <>
                          <span>•</span>
                          <Paperclip className="h-3 w-3" />
                          <span>{message.attachments.length} file{message.attachments.length > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    {message.video_room_id && (
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                        <Video className="h-3 w-3 mr-1" />
                        Video Call
                      </Badge>
                    )}
                    <Badge variant={getPriorityColor(message.priority)} className="text-xs">
                      {message.priority}
                    </Badge>
                    {message.is_archived && (
                      <Badge variant="outline" className="text-xs">
                        <Archive className="h-3 w-3 mr-1" />
                        Archived
                      </Badge>
                    )}
                   </div>
                 </div>
               </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};