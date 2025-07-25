import { useCallback } from 'react';
import { z } from 'zod';

// Common validation schemas
export const schemas = {
  email: z.string().email('Invalid email format').max(254, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  recipientId: z.string().uuid('Invalid recipient ID format'),
  uuid: z.string().uuid('Invalid UUID format'),
  fileName: z.string()
    .min(1, 'Filename required')
    .max(255, 'Filename too long')
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'Invalid filename characters'),
  messageContent: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long')
    .refine(content => content.trim().length > 0, 'Message cannot be only whitespace'),
  url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
  fileSize: z.number().min(0).max(5 * 1024 * 1024, 'File too large (max 5MB)'),
  mimeType: z.enum([
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ]).refine(() => true, { message: 'Unsupported file type' })
};

// Input sanitization functions
export const sanitizers = {
  // Remove potentially dangerous HTML tags and scripts
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Sanitize text input
  text: (input: string): string => {
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .slice(0, 10000); // Limit length
  },

  // Sanitize filename
  filename: (input: string): string => {
    return input
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename chars
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .slice(0, 255); // Limit length
  },

  // Sanitize URL
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow https and http protocols
      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  }
};

export const useRequestValidation = () => {
  // Rate limiting state (in real app, this would be more sophisticated)
  const rateLimitState = new Map<string, { count: number; resetTime: number }>();

  // Check rate limit
  const checkRateLimit = useCallback((
    identifier: string, 
    maxRequests: number = 100, 
    windowMs: number = 60000
  ): boolean => {
    const now = Date.now();
    const key = `${identifier}-${Math.floor(now / windowMs)}`;
    
    const current = rateLimitState.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= maxRequests) {
      return false;
    }
    
    current.count++;
    rateLimitState.set(key, current);
    
    // Cleanup old entries
    for (const [k, v] of rateLimitState.entries()) {
      if (v.resetTime < now) {
        rateLimitState.delete(k);
      }
    }
    
    return true;
  }, []);

  // Validate and sanitize input
  const validateInput = useCallback(<T>(
    schema: z.ZodSchema<T>,
    input: unknown,
    sanitizer?: (input: any) => any
  ): { success: boolean; data?: T; errors?: string[] } => {
    try {
      let processedInput = input;
      
      // Apply sanitizer if provided
      if (sanitizer && typeof input === 'string') {
        processedInput = sanitizer(input);
      }
      
      const result = schema.parse(processedInput);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        success: false,
        errors: ['Validation failed']
      };
    }
  }, []);

  // Validate request payload
  const validateRequestPayload = useCallback((
    payload: Record<string, unknown>,
    maxSize: number = 1024 * 1024 // 1MB default
  ): { valid: boolean; errors?: string[] } => {
    const errors: string[] = [];

    // Check payload size
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > maxSize) {
      errors.push(`Payload too large: ${payloadSize} bytes (max: ${maxSize})`);
    }

    // Check for deeply nested objects (potential DoS)
    const checkDepth = (obj: any, depth = 0): number => {
      if (depth > 10) return depth; // Max depth limit
      if (typeof obj === 'object' && obj !== null) {
        return Math.max(...Object.values(obj).map(v => checkDepth(v, depth + 1)));
      }
      return depth;
    };

    if (checkDepth(payload) > 10) {
      errors.push('Payload structure too deep');
    }

    // Check for suspicious patterns
    const payloadStr = JSON.stringify(payload);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /__proto__/,
      /constructor/,
      /prototype/
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(payloadStr)) {
        errors.push('Suspicious content detected');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }, []);

  return {
    schemas,
    sanitizers,
    checkRateLimit,
    validateInput,
    validateRequestPayload
  };
};