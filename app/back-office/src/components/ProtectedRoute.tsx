import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, hasRole, logout } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = hasRole('ADMIN') || hasRole('MANAGER') || hasRole('STAFF');

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-in fade-in duration-500">
        <div className="text-center max-w-md p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <div className="rounded-full bg-red-500/10 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            This portal is restricted to cinema administrators and staff. Your account does not have the required permissions.
          </p>
          <Button onClick={() => logout()} variant="outline" className="w-full border-border/50 hover:bg-foreground/5">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};