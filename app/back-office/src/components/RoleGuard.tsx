import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { JSX } from 'react';

interface RoleGuardProps {
  children: JSX.Element;
  allowedRoles: string[];
  fallbackPath?: string;
}

export const RoleGuard = ({ children, allowedRoles, fallbackPath = '/' }: RoleGuardProps) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!allowedRoles.some(role => hasRole(role))) {
    return <Navigate to={fallbackPath} replace />;
  }
  return children;
};