'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, hasPermission, hasAnyRole, UserRole } from '@/lib/rbac';
import styled from 'styled-components';

interface WithRoleProps {
  children: ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  permission?: string;
  fallback?: ReactNode;
  requireVerified?: boolean;
}

export const WithRole: React.FC<WithRoleProps> = ({
  children,
  role,
  roles,
  permission,
  fallback = <AccessDenied>Access Denied</AccessDenied>,
  requireVerified = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check if user needs to be verified
  if (requireVerified && !user.is_verified) {
    return <>{fallback}</>;
  }

  // Check specific role
  if (role && !hasRole(user, role)) {
    return <>{fallback}</>;
  }

  // Check any of multiple roles
  if (roles && !hasAnyRole(user, roles)) {
    return <>{fallback}</>;
  }

  // Check specific permission
  if (permission && !hasPermission(user, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const AccessDenied = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: #c33;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem;
`;
