import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'validating' | 'uploading' | 'complete' | 'error';
  error?: string;
}

// Magic number signatures for file type validation
const MAGIC_NUMBERS: Record<string, string[]> = {
  'image/jpeg': ['FFD8FF'],
  'image/png': ['89504E47'],
  'image/gif': ['474946', '474938'],
  'image/webp': ['52494646', '57454250'],
  'application/pdf': ['255044462D'],
  'text/plain': [] // Plain text has no reliable magic number
};

export const useSecureFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const { toast } = useToast();

  // Read file header for magic number validation
  const readFileHeader = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
        const hex = Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        resolve(hex);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file.slice(0, 8));
    });
  }, []);

  // Enhanced client-side validation with magic number checking
  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validations - stricter limits for security
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const dangerousExtensions = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp|html|htm|svg)$/i;

    // File type check
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported`);
    }

    // File size check
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }

    // File name checks
    if (file.name.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }

    if (dangerousExtensions.test(file.name)) {
      errors.push('File extension not allowed for security reasons');
    }

    if (/[\x00-\x1F\x7F]/.test(file.name)) {
      errors.push('Invalid characters in filename');
    }

    // Empty file check
    if (file.size === 0) {
      errors.push('Empty files are not allowed');
    }

    // Magic number validation for supported types
    if (errors.length === 0 && MAGIC_NUMBERS[file.type]) {
      try {
        const fileHeader = await readFileHeader(file);
        const expectedHeaders = MAGIC_NUMBERS[file.type];
        
        if (expectedHeaders.length > 0) {
          const isValidMagicNumber = expectedHeaders.some(header => 
            fileHeader.startsWith(header)
          );
          
          if (!isValidMagicNumber) {
            errors.push('File content does not match the declared file type');
          }
        }
      } catch (error) {
        warnings.push('Could not verify file type signature');
      }
    }

    // Additional warnings
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push('Large file - upload may take some time');
    }

    if (file.name.length > 100) {
      warnings.push('Very long filename');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [readFileHeader]);

  // Server-side validation using enhanced function
  const validateFileOnServer = useCallback(async (
    fileName: string,
    fileSize: number,
    mimeType: string,
    fileContent?: ArrayBuffer
  ): Promise<FileValidationResult> => {
    try {
      let fileBytes: number[] | null = null;
      
      if (fileContent) {
        const uint8Array = new Uint8Array(fileContent.slice(0, 1024)); // First 1KB
        fileBytes = Array.from(uint8Array);
      }

      const { data, error } = await supabase.rpc('validate_file_upload_strict', {
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType
      });

      if (error) throw error;

      const validationResult = data as { valid: boolean; errors?: string[]; warnings?: string[] };

      return {
        valid: validationResult.valid,
        errors: validationResult.errors || [],
        warnings: validationResult.warnings || []
      };
    } catch (error) {
      console.error('Server validation error:', error);
      return {
        valid: false,
        errors: ['Server validation failed'],
        warnings: []
      };
    }
  }, []);

  // Sanitize filename
  const sanitizeFileName = useCallback((filename: string): string => {
    return filename
      .replace(/[^\w\s.-]/gi, '') // Remove special characters except dots, dashes, underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.+/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 200); // Limit length
  }, []);

  // Enhanced secure upload function
  const uploadFile = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    const uploadId = `${file.name}-${Date.now()}`;
    
    try {
      // Update progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          fileName: file.name,
          progress: 0,
          status: 'validating'
        }
      }));

      // Client-side validation
      const clientValidation = await validateFile(file);
      if (!clientValidation.valid) {
        throw new Error(clientValidation.errors.join(', '));
      }

      // Show warnings if any
      if (clientValidation.warnings.length > 0) {
        toast({
          title: "Upload Warning",
          description: clientValidation.warnings.join(', '),
          variant: "default",
        });
      }

      // Get user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Authentication required');
      }

      // Server-side validation
      const fileBuffer = await file.arrayBuffer();
      const serverValidation = await validateFileOnServer(
        file.name,
        file.size,
        file.type,
        fileBuffer
      );

      if (!serverValidation.valid) {
        throw new Error(serverValidation.errors.join(', '));
      }

      // Update progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 25,
          status: 'uploading'
        }
      }));

      // Sanitize filename and create unique path
      const sanitizedName = sanitizeFileName(file.name);
      const timestamp = Date.now();
      const fileName = `${user.user.id}/${timestamp}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('message-files')
        .upload(fileName, file, {
          upsert: false
        });

      if (error) throw error;

      // Update progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 90,
          status: 'uploading'
        }
      }));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('message-files')
        .getPublicUrl(data.path);

      // Update progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          progress: 100,
          status: 'complete'
        }
      }));

      // Log successful upload
      await supabase.rpc('log_security_event', {
        event_type: 'file_upload_success',
        details: {
          filename: file.name,
          file_size: file.size,
          mime_type: file.type
        }
      });

      onProgress?.(100);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update progress with error
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'error',
          error: error.message
        }
      }));

      return {
        success: false,
        error: error.message
      };
    }
  }, [validateFile, validateFileOnServer, sanitizeFileName, toast]);

  // Clear upload progress
  const clearUploadProgress = useCallback((uploadId?: string) => {
    if (uploadId) {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadId];
        return newProgress;
      });
    } else {
      setUploadProgress({});
    }
  }, []);

  return {
    uploadFile,
    validateFile,
    uploadProgress,
    clearUploadProgress,
    sanitizeFileName
  };
};