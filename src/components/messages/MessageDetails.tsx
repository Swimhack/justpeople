import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { MediaRenderer } from "@/components/messages/MediaRenderer";
import { VideoCallButton } from "./VideoCallButton";
import { VideoCallModal } from "./VideoCallModal";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  User, 
  Calendar, 
  Reply, 
  Archive, 
  AlertCircle,
  Send,
  Circle,
  Eye,
  Paperclip,
  Video
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@/types/message";

interface MessageDetailsProps {
  selectedMessage: Message | null;
  onArchiveMessage: (messageId: string) => void;
  onSendReply: (message: Message, replyContent: string) => void;
}

export const MessageDetails = ({
  selectedMessage,
  onArchiveMessage,
  onSendReply
}: MessageDetailsProps) => {
  const [replyContent, setReplyContent] = useState("");
  const [isTypingReply, setIsTypingReply] = useState(false);
  const [videoCallModal, setVideoCallModal] = useState<{
    isOpen: boolean;
    roomData: { roomName: string; token: string; url: string } | null;
  }>({ isOpen: false, roomData: null });
  const { 
    reactions, 
    typingUsers, 
    userPresence, 
    setTyping, 
    addReaction, 
    removeReaction 
  } = useRealtimeMessages();
  const { user } = useAuth();

  // Handle typing indicator for replies
  useEffect(() => {
    if (replyContent.trim() && !isTypingReply) {
      setIsTypingReply(true);
      setTyping(true, selectedMessage?.sender_id);
    } else if (!replyContent.trim() && isTypingReply) {
      setIsTypingReply(false);
      setTyping(false, selectedMessage?.sender_id);
    }
  }, [replyContent, isTypingReply, selectedMessage?.sender_id, setTyping]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'high' ? <AlertCircle className="h-4 w-4" /> : null;
  };

  const handleSendReply = () => {
    if (selectedMessage && replyContent.trim()) {
      onSendReply(selectedMessage, replyContent);
      setReplyContent("");
      setIsTypingReply(false);
      setTyping(false, selectedMessage.sender_id);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!selectedMessage) return;
    
    // Simple implementation - always add reaction for now
    await addReaction(selectedMessage.id, reactionType);
  };

  const handleVideoCallStart = (roomData: { roomName: string; token: string; url: string }) => {
    setVideoCallModal({ isOpen: true, roomData });
  };

  const handleCloseVideoCall = () => {
    setVideoCallModal({ isOpen: false, roomData: null });
  };

  if (!selectedMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Message Details
          </CardTitle>
          <CardDescription>
            Select a message to view details and reply
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Select a message from the list to view its contents and reply
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messageReactions = reactions.filter(r => r.message_id === selectedMessage.id);
  const reactionCounts = messageReactions.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const senderPresence = userPresence.find(p => p.user_id === selectedMessage.sender_id);
  const isOnline = senderPresence?.status === 'online';
  const lastSeen = senderPresence?.last_seen;

  const currentTypingUsers = typingUsers.filter(t => 
    t.recipient_id === selectedMessage.sender_id && t.user_id !== selectedMessage.sender_id
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Message Details
        </CardTitle>
        <CardDescription>
          View and reply to the selected message
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {selectedMessage.subject}
                {!selectedMessage.is_read && (
                  <Badge variant="default" className="text-xs">New</Badge>
                )}
              </h3>
              <div className="flex gap-2">
                <VideoCallButton
                  messageId={selectedMessage.id}
                  hasVideoRoom={!!selectedMessage.video_room_id}
                  isMessageOwner={selectedMessage.sender_id === user?.id}
                  onVideoCallStart={handleVideoCallStart}
                />
                {selectedMessage.video_room_id && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                    <Video className="h-3 w-3 mr-1" />
                    Video Room Active
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onArchiveMessage(selectedMessage.id)}
                  disabled={selectedMessage.is_archived}
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Badge variant={getPriorityColor(selectedMessage.priority)} className="flex items-center gap-1">
                  {getPriorityIcon(selectedMessage.priority)}
                  {selectedMessage.priority}
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                From: {selectedMessage.sender_id}
                <div className="flex items-center gap-1">
                  <Circle className={`h-2 w-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                  <span className="text-xs">
                    {isOnline ? 'Online' : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
          </div>

          {/* Multimedia attachments */}
          {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="h-4 w-4" />
                Attachments ({selectedMessage.attachments.length})
              </div>
              <MediaRenderer attachments={selectedMessage.attachments} />
            </div>
          )}

          {/* Message Reactions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Reactions:</span>
              <div className="flex gap-1">
                {['👍', '❤️', '😊'].map((emoji, index) => {
                  const type = ['thumbs_up', 'heart', 'smile'][index];
                  const count = reactionCounts[type] || 0;
                  
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleReaction(type)}
                    >
                      <span className="mr-1">{emoji}</span>
                      {count > 0 && <span className="text-xs">{count}</span>}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Reply Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Reply className="h-4 w-4" />
                Reply to this message:
              </label>
              {currentTypingUsers.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                  </div>
                  <span>Someone is typing...</span>
                </div>
              )}
            </div>
            
            <Textarea
              placeholder="Type your reply here..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            
            <Button 
              onClick={handleSendReply}
              disabled={!replyContent.trim()}
              className="w-full flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Reply
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Press Cmd/Ctrl + Enter to send quickly
            </p>
          </div>
        </div>
      </CardContent>
      
      <VideoCallModal
        isOpen={videoCallModal.isOpen}
        onClose={handleCloseVideoCall}
        roomData={videoCallModal.roomData}
      />
    </Card>
  );
};