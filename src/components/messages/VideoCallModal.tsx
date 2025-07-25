import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomData: {
    roomName: string;
    token: string;
    url: string;
  } | null;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  roomData
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (isOpen && roomData && iframeRef.current) {
      // Initialize Daily.co iframe
      const dailyUrl = `${roomData.url}?t=${roomData.token}`;
      console.log('Loading Daily.co URL:', dailyUrl);
      
      // Set iframe properties for better embedding
      iframeRef.current.src = dailyUrl;
      iframeRef.current.onload = () => {
        console.log('Daily.co iframe loaded successfully');
      };
      iframeRef.current.onerror = (error) => {
        console.error('Daily.co iframe failed to load:', error);
      };
    }
  }, [isOpen, roomData]);

  const handleOpenInNewTab = () => {
    if (roomData) {
      const dailyUrl = `${roomData.url}?t=${roomData.token}`;
      window.open(dailyUrl, '_blank');
      onClose();
    }
  };

  if (!roomData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Video Call</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-4 pt-0">
          <iframe
            ref={iframeRef}
            className="w-full h-full rounded-lg border border-border bg-gray-100"
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            style={{ minHeight: '500px' }}
            title="Daily.co Video Call"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};