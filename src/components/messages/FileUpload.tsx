import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSecureFileUpload } from "@/hooks/useSecureFileUpload";
import { 
  Paperclip, 
  Image, 
  FileText, 
  Video, 
  Music, 
  X,
  Upload
} from "lucide-react";

interface FileUploadProps {
  onFileUploaded: (file: { url: string; name: string; type: string; size: number }) => void;
  disabled?: boolean;
}

interface UploadingFile {
  name: string;
  progress: number;
  type: string;
  size: number;
}

export const FileUpload = ({ onFileUploaded, disabled }: FileUploadProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile: secureUploadFile, uploadProgress } = useSecureFileUpload();

  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB for security

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced client-side validation
  const validateFile = (file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported`);
    }

    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${formatFileSize(maxFileSize)}`);
    }

    // Check filename for security issues
    if (file.name.length > 255) {
      errors.push('Filename too long');
    }

    // Check for dangerous file extensions
    const dangerousExtensions = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp)$/i;
    if (dangerousExtensions.test(file.name)) {
      errors.push('File extension not allowed for security reasons');
    }

    // Check for null bytes and control characters in filename
    if (/[\x00-\x1F\x7F]/.test(file.name)) {
      errors.push('Invalid characters in filename');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Sanitize filename to prevent security issues
  const sanitizeFileName = (filename: string): string => {
    return filename
      .replace(/[^\w\s.-]/gi, '') // Remove special characters except dots, dashes, underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.+/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255); // Limit length
  };

  const uploadFile = async (file: File) => {
    try {
      // Add to uploading files for UI tracking
      const uploadingFile: UploadingFile = {
        name: file.name,
        progress: 0,
        type: file.type,
        size: file.size
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);

      // Use secure upload with progress tracking
      const result = await secureUploadFile(file, (progress) => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, progress }
              : f
          )
        );
      });

      // Remove from uploading
      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));

      if (result.success && result.url) {
        // Notify parent component
        onFileUploaded({
          url: result.url,
          name: file.name,
          type: file.type,
          size: file.size
        });

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
      toast({
        title: "Upload Error",
        description: `Failed to upload ${file.name}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      // Validate file before upload
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "File Validation Error",
          description: `${file.name}: ${validation.errors.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      uploadFile(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeUploadingFile = (fileName: string) => {
    setUploadingFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          Attach
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop images, videos, audio, or documents here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max size: {formatFileSize(maxFileSize)} • Supports multimedia files
        </p>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div key={file.name} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                <Progress value={file.progress} className="h-1 mt-1" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadingFile(file.name)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};