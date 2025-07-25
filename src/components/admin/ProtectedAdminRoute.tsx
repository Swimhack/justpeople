import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { useAutoImportContacts } from '@/hooks/useAutoImportContacts';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedAdminRoute({ 
  children, 
  requireAdmin = false 
}: ProtectedAdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasAdminAccess, isAdmin, loading: rolesLoading, error: rolesError, roles } = useRoles();
  
  // Auto-import JJP contacts on first login
  useAutoImportContacts(user);

  console.log('🛡️ ProtectedAdminRoute check:', { 
    user: user?.email, 
    authLoading, 
    rolesLoading, 
    rolesError,
    requireAdmin 
  });

  // If still checking auth state, show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    console.log('🚫 No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If roles are still loading, show loading
  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // If both auth and roles are loaded but roles failed to load, allow access with warning
  if (rolesError) {
    console.warn('⚠️ Roles failed to load, allowing access:', rolesError);
    return <>{children}</>;
  }

  // Check permissions
  const hasPermission = requireAdmin ? isAdmin() : hasAdminAccess();
  
  console.log('🔍 Permission check:', { 
    hasPermission, 
    requireAdmin, 
    isAdmin: isAdmin(), 
    hasAdminAccess: hasAdminAccess(),
    roles: roles 
  });

  if (!hasPermission) {
    console.log('🚫 Insufficient permissions, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ Access granted');
  return <>{children}</>;
}