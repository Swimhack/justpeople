import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserActivityLogger } from '@/hooks/useUserActivityLogger';

interface VideoCallButtonProps {
  messageId: string;
  hasVideoRoom: boolean;
  isMessageOwner: boolean;
  onVideoCallStart: (roomData: { roomName: string; token: string; url: string }) => void;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  messageId,
  hasVideoRoom,
  isMessageOwner,
  onVideoCallStart
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logVideoCall, logInteraction } = useUserActivityLogger();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleVideoAction = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use video calls",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const action = hasVideoRoom ? 'join' : 'create';
      
      // Log video call activity
      logVideoCall(action === 'create' ? 'start' : 'join', messageId, {
        messageId,
        action,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase.functions.invoke('create-video-room', {
        body: { messageId, action }
      });

      if (error) throw error;

      onVideoCallStart(data);
      
      toast({
        title: hasVideoRoom ? "Joining video call..." : "Video call started!",
        description: hasVideoRoom ? "Opening video call window" : "Video room created successfully",
      });

    } catch (error: any) {
      console.error('Video call error:', error);
      
      // Extract more specific error message
      let errorMessage = "Failed to start video call";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Video call failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = hasVideoRoom ? "Join Call" : "Start Video Call";
  const Icon = hasVideoRoom ? Video : VideoOff;

  // Only show button if user is message owner (can create) or if room exists (anyone can join)
  if (!hasVideoRoom && !isMessageOwner) {
    return null;
  }

  return (
    <Button
      variant={hasVideoRoom ? "default" : "outline"}
      size="sm"
      onClick={() => {
        logInteraction('video_call_button', hasVideoRoom ? 'join' : 'start');
        handleVideoAction();
      }}
      disabled={isLoading}
      className={`flex items-center gap-2 ${hasVideoRoom ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {buttonText}
    </Button>
  );
};