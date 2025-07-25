import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoCallModal } from '@/components/messages/VideoCallModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Video, Users, Clock } from 'lucide-react';

export default function VideoCallPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomName, setRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoCallModal, setVideoCallModal] = useState<{
    isOpen: boolean;
    roomData: { roomName: string; token: string; url: string } | null;
  }>({ isOpen: false, roomData: null });

  const startVideoCall = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a video call",
        variant: "destructive"
      });
      return;
    }

    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a room name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-video-room', {
        body: { 
          action: 'create',
          roomName: roomName.trim()
        }
      });

      if (error) throw error;

      setVideoCallModal({
        isOpen: true,
        roomData: data
      });
      
      toast({
        title: "Video call started!",
        description: "Video room created successfully",
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

  const joinVideoCall = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join a video call",
        variant: "destructive"
      });
      return;
    }

    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter the room name to join",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // First try to join existing room, if it fails, create it
      const { data, error } = await supabase.functions.invoke('create-video-room', {
        body: { 
          action: 'join',
          roomName: roomName.trim()
        }
      });

      if (error && error.message?.includes('Failed to create meeting token')) {
        // Room doesn't exist, create it instead
        const { data: createData, error: createError } = await supabase.functions.invoke('create-video-room', {
          body: { 
            action: 'create',
            roomName: roomName.trim()
          }
        });
        
        if (createError) throw createError;
        
        setVideoCallModal({
          isOpen: true,
          roomData: createData
        });
        
        toast({
          title: "Room created!",
          description: "Created and joined new video room",
        });
      } else if (error) {
        throw error;
      } else {
        setVideoCallModal({
          isOpen: true,
          roomData: data
        });
        
        toast({
          title: "Joining video call...",
          description: "Opening video call window",
        });
      }

    } catch (error: any) {
      console.error('Video call error:', error);
      
      // Extract more specific error message
      let errorMessage = "Failed to join video call";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Failed to join call",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseVideoCall = () => {
    setVideoCallModal({ isOpen: false, roomData: null });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Video Chat</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start or join video calls instantly. Perfect for team meetings, 1-on-1s, or group discussions.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Video className="h-6 w-6" />
              Quick Video Call
            </CardTitle>
            <CardDescription>
              Enter a room name to start or join a video call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="e.g., team-meeting, daily-standup, project-sync"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && startVideoCall()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={startVideoCall}
                disabled={isLoading}
                className="w-full"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Call
              </Button>
              <Button 
                onClick={joinVideoCall}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Join Call
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                How it works:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter any room name (same name = same room)</li>
                <li>• Start a new call or join an existing one</li>
                <li>• Share the room name with others to invite them</li>
                <li>• Up to 3 participants supported</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <VideoCallModal
        isOpen={videoCallModal.isOpen}
        onClose={handleCloseVideoCall}
        roomData={videoCallModal.roomData}
      />
    </div>
  );
}