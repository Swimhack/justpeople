import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Download, 
  Eye, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  FileText,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw
} from "lucide-react";

import { MediaFile } from "@/types/message";

interface MediaRendererProps {
  attachments: MediaFile[];
  compact?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (type.startsWith('video/')) return <VideoIcon className="h-4 w-4" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const ImageRenderer = ({ file, compact }: { file: MediaFile; compact?: boolean }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <Card className="p-4 flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">Image preview unavailable</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={file.url} download={file.name}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </Card>
    );
  }

  if (compact) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer group">
            <img
              src={file.url}
              alt={file.name}
              className="w-16 h-16 object-cover rounded-lg border"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Maximize2 className="h-4 w-4 text-white" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            onError={() => setImageError(true)}
          />
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="outline" asChild>
              <a href={file.url} download={file.name}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <div className="relative">
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={() => setImageError(true)}
            />
            <Badge className="absolute top-2 right-2 bg-black/70 text-white">
              <ImageIcon className="h-3 w-3 mr-1" />
              Image
            </Badge>
          </div>
          <div className="p-3">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          onError={() => setImageError(true)}
        />
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button variant="outline" asChild>
            <a href={file.url} download={file.name}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VideoRenderer = ({ file, compact }: { file: MediaFile; compact?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (compact) {
    return (
      <Card className="p-2">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <VideoIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={file.url} download={file.name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="relative">
        <video
          className="w-full h-48 object-cover rounded-t-lg"
          controls
          preload="metadata"
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={file.url} type={file.type} />
          Your browser does not support video playback.
        </video>
        <Badge className="absolute top-2 right-2 bg-black/70 text-white">
          <VideoIcon className="h-3 w-3 mr-1" />
          Video
        </Badge>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={file.url} download={file.name}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const AudioRenderer = ({ file, compact }: { file: MediaFile; compact?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className={compact ? "p-2" : "p-4"}>
      <div className="flex items-center gap-3">
        <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} bg-primary/10 rounded-lg flex items-center justify-center`}>
          <Music className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} text-primary`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-sm' : 'text-base'} font-medium truncate`}>{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          {!compact && (
            <audio
              className="w-full mt-2"
              controls
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={file.url} type={file.type} />
              Your browser does not support audio playback.
            </audio>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={file.url} download={file.name}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </Card>
  );
};

const DocumentRenderer = ({ file, compact }: { file: MediaFile; compact?: boolean }) => {
  const isPDF = file.type === 'application/pdf';

  if (compact) {
    return (
      <Card className="p-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
            {getFileIcon(file.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={file.url} download={file.name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
          {getFileIcon(file.type)}
        </div>
        <div className="flex-1">
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          <Badge variant="outline" className="mt-2">
            {file.type.split('/')[1]?.toUpperCase() || 'Document'}
          </Badge>
        </div>
        <div className="flex gap-2">
          {isPDF && (
            <Button variant="outline" size="sm" asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={file.url} download={file.name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const MediaRenderer = ({ attachments, compact = false }: MediaRendererProps) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const images = attachments.filter(file => file.type.startsWith('image/'));
  const videos = attachments.filter(file => file.type.startsWith('video/'));
  const audios = attachments.filter(file => file.type.startsWith('audio/'));
  const documents = attachments.filter(file => 
    !file.type.startsWith('image/') && 
    !file.type.startsWith('video/') && 
    !file.type.startsWith('audio/')
  );

  return (
    <div className="space-y-3">
      {/* Images */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${compact ? 'grid-cols-4' : images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((file, index) => (
            <ImageRenderer key={index} file={file} compact={compact} />
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1'}`}>
          {videos.map((file, index) => (
            <VideoRenderer key={index} file={file} compact={compact} />
          ))}
        </div>
      )}

      {/* Audio */}
      {audios.length > 0 && (
        <div className="space-y-2">
          {audios.map((file, index) => (
            <AudioRenderer key={index} file={file} compact={compact} />
          ))}
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((file, index) => (
            <DocumentRenderer key={index} file={file} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
};