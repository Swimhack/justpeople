import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityManager } from './useSecurityManager';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// Auth state cleanup utility
export const cleanupAuthState = () => {
  console.log('🧹 Cleaning up auth state...');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log('🗑️ Removed auth key:', key);
    }
  });
  
  // Remove from sessionStorage if available
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
        console.log('🗑️ Removed session key:', key);
      }
    });
  } catch (e) {
    // sessionStorage might not be available
  }
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  
  const initializingRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    checkAccountLockout, 
    logLoginAttempt, 
    createUserSession, 
    terminateSession,
    securityState 
  } = useSecurityManager();

  useEffect(() => {
    console.log('🔐 Initializing auth system...');
    
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        initializingRef.current = false;
        
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
        });
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      if (!mounted) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          console.log('📋 Initial session:', session?.user?.email || 'No session');
        }
        
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        initializingRef.current = false;
        
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
        });
      } catch (error) {
        console.error('💥 Exception getting initial session:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (initializingRef.current && mounted) {
        console.log('⏰ Auth initialization timeout, forcing non-loading state');
        setAuthState(prev => ({ ...prev, loading: false }));
        initializingRef.current = false;
      }
    }, 5000);

    // Get initial session
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting sign in for:', email);
    
    try {
      // Check account lockout first
      const lockoutStatus = await checkAccountLockout(email);
      if (lockoutStatus.locked) {
        const error = new Error(lockoutStatus.message || 'Account temporarily locked');
        await logLoginAttempt({
          identifier: email,
          success: false,
          attemptType: 'password',
          metadata: { lockout_status: lockoutStatus }
        });
        
        // Log failed login activity
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'warn',
            message: 'Login blocked due to account lockout',
            source: 'authentication',
            metadata: {
              activityType: 'login',
              category: 'authentication',
              email,
              lockoutStatus,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          }
        });
        
        return { error };
      }

      // Clean up existing auth state first
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('🚪 Global sign out completed');
      } catch (err) {
        console.log('⚠️ Global sign out failed (continuing):', err);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Log the attempt
      await logLoginAttempt({
        identifier: email,
        success: !error,
        attemptType: 'password',
        metadata: { 
          error_message: error?.message,
          user_id: data?.user?.id 
        }
      });
      
      // Enhanced activity logging
      const activityMetadata = {
        activityType: 'login',
        category: 'authentication',
        email,
        success: !error,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      if (error) {
        console.error('❌ Sign in error:', error);
        
        // Log failed login activity
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'warn',
            message: `Login failed: ${error.message}`,
            source: 'authentication',
            metadata: {
              ...activityMetadata,
              errorMessage: error.message,
              errorCode: error.name
            }
          }
        });
      } else {
        console.log('✅ Sign in successful');
        
        // Create security session tracking
        if (data.user) {
          await createUserSession(data.user.id);
        }
        
        // Log successful login activity
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'info',
            message: 'User login successful',
            source: 'authentication',
            metadata: {
              ...activityMetadata,
              userId: data.user?.id,
              sessionStartTime: new Date().toISOString()
            }
          }
        });
      }
      
      return { error };
    } catch (err: any) {
      console.error('💥 Sign in exception:', err);
      await logLoginAttempt({
        identifier: email,
        success: false,
        attemptType: 'password',
        metadata: { exception: err.message }
      });
      
      // Log exception activity
      await supabase.functions.invoke('application-logs', {
        body: {
          level: 'error',
          message: `Login exception: ${err.message}`,
          source: 'authentication',
          metadata: {
            activityType: 'login',
            category: 'authentication',
            email,
            success: false,
            exception: err.message,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('📝 Attempting sign up for:', email);
    
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });
      
      // Log signup activity
      const activityMetadata = {
        activityType: 'signup',
        category: 'authentication',
        email,
        success: !error,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      };

      if (error) {
        console.error('❌ Sign up error:', error);
        
        // Log failed signup
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'warn',
            message: `Signup failed: ${error.message}`,
            source: 'authentication',
            metadata: {
              ...activityMetadata,
              errorMessage: error.message,
              errorCode: error.name
            }
          }
        });
      } else {
        console.log('✅ Sign up successful');
        
        // Log successful signup
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'info',
            message: 'User signup successful',
            source: 'authentication',
            metadata: {
              ...activityMetadata,
              userId: data.user?.id,
              needsConfirmation: !!data.user && !data.session
            }
          }
        });
      }
      
      return { error };
    } catch (err: any) {
      console.error('💥 Sign up exception:', err);
      
      // Log exception
      await supabase.functions.invoke('application-logs', {
        body: {
          level: 'error',
          message: `Signup exception: ${err.message}`,
          source: 'authentication',
          metadata: {
            activityType: 'signup',
            category: 'authentication',
            email,
            success: false,
            exception: err.message,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('🚪 Attempting sign out...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      // Log logout activity before signing out
      if (session) {
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'info',
            message: 'User logout initiated',
            source: 'authentication',
            metadata: {
              activityType: 'logout',
              category: 'authentication',
              userId,
              sessionDuration: securityState.sessionId ? 'tracked' : 'unknown',
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              logoutMethod: 'manual'
            }
          }
        });
      }

      // Terminate security session first
      if (securityState.sessionId) {
        await terminateSession();
      }

      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('❌ Sign out error:', error);
        
        // Log failed logout
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'warn',
            message: `Logout failed: ${error.message}`,
            source: 'authentication',
            metadata: {
              activityType: 'logout',
              category: 'authentication',
              userId,
              success: false,
              errorMessage: error.message,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          }
        });
      } else {
        console.log('✅ Sign out successful');
        
        // Log successful logout
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'info',
            message: 'User logout successful',
            source: 'authentication',
            metadata: {
              activityType: 'logout',
              category: 'authentication',
              userId,
              success: true,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              sessionEndTime: new Date().toISOString()
            }
          }
        });
      }
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
      return { error };
    } catch (err: any) {
      console.error('💥 Sign out exception:', err);
      
      // Log exception
      await supabase.functions.invoke('application-logs', {
        body: {
          level: 'error',
          message: `Logout exception: ${err.message}`,
          source: 'authentication',
          metadata: {
            activityType: 'logout',
            category: 'authentication',
            success: false,
            exception: err.message,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return { error: err };
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔄 Attempting password reset for:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      // Log password reset activity
      const activityMetadata = {
        activityType: 'password_reset',
        category: 'authentication',
        email,
        success: !error,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      if (error) {
        console.error('❌ Password reset error:', error);
        
        // Log failed password reset
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'warn',
            message: `Password reset failed: ${error.message}`,
            source: 'authentication',
            metadata: {
              ...activityMetadata,
              errorMessage: error.message,
              errorCode: error.name
            }
          }
        });
      } else {
        console.log('✅ Password reset email sent');
        
        // Log successful password reset request
        await supabase.functions.invoke('application-logs', {
          body: {
            level: 'info',
            message: 'Password reset email sent',
            source: 'authentication',
            metadata: activityMetadata
          }
        });
      }
      
      return { error };
    } catch (err: any) {
      console.error('💥 Password reset exception:', err);
      
      // Log exception
      await supabase.functions.invoke('application-logs', {
        body: {
          level: 'error',
          message: `Password reset exception: ${err.message}`,
          source: 'authentication',
          metadata: {
            activityType: 'password_reset',
            category: 'authentication',
            email,
            success: false,
            exception: err.message,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return { error: err };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    securityState,
  };
};