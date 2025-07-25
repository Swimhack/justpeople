import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'moderator' | 'user';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export const useRoles = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is still loading, keep roles loading
    if (authLoading) {
      console.log('🔄 Auth still loading, keeping roles in loading state');
      setLoading(true);
      return;
    }

    // If auth is done and no user, clear roles
    if (!user) {
      console.log('👤 No user, clearing roles');
      setRoles([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🎭 Fetching roles for user:', user.email);
    fetchUserRoles();
  }, [user, authLoading]);

  const fetchUserRoles = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available for role fetch');
      setLoading(false);
      return;
    }

    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Role fetch timeout, using empty roles');
      setRoles([]);
      setLoading(false);
      setError('Role fetch timeout');
    }, 5000);

    try {
      console.log('🔍 Fetching roles from database...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Database error fetching roles:', error);
        throw error;
      }

      const userRoles = data?.map((item) => item.role as UserRole) || [];
      console.log('✅ Fetched roles:', userRoles);
      
      setRoles(userRoles);
      setError(null);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('💥 Error fetching user roles:', error);
      setRoles([]);
      setError(error.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isModerator = (): boolean => {
    return hasRole('moderator');
  };

  const hasAdminAccess = (): boolean => {
    return isAdmin() || isModerator();
  };

  return {
    roles,
    loading,
    error,
    hasRole,
    isAdmin,
    isModerator,
    hasAdminAccess,
    refetch: fetchUserRoles,
  };
};