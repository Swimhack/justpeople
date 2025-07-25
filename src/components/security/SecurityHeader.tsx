import { useEffect } from 'react';

interface SecurityHeadersProps {
  nonce?: string;
}

export const SecurityHeaders = ({ nonce }: SecurityHeadersProps) => {
  useEffect(() => {
    // Set security headers via meta tags for CSP
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Content Security Policy
    const cspPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');

    setMetaTag('content-security-policy', cspPolicy);
    
    // Additional security headers
    setMetaTag('x-content-type-options', 'nosniff');
    setMetaTag('x-frame-options', 'DENY');
    setMetaTag('x-xss-protection', '1; mode=block');
    setMetaTag('referrer-policy', 'strict-origin-when-cross-origin');
    setMetaTag('permissions-policy', 'geolocation=(), microphone=(), camera=()');

    // Set HSTS if on HTTPS
    if (window.location.protocol === 'https:') {
      setMetaTag('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
    }
  }, [nonce]);

  return null; // This component doesn't render anything visible
};