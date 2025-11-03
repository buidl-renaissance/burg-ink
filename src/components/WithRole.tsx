'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, hasPermission, hasAnyRole, UserRole, User } from '@/lib/rbac';
import styled from 'styled-components';
import { FaLock } from 'react-icons/fa';

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
  requireVerified = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <AccessDenied title="Authentication Required" message="Please log in to access this feature." />;
  }

  // Check if user needs to be verified
  if (requireVerified && !user.is_verified) {
    return <AccessDenied title="Email Verification Required" message="Please verify your email address to access this feature." />;
  }

  // Check specific role
  if (role && user.role && !hasRole(user as User, role)) {
    return <AccessDenied title="Insufficient Permissions" message={`This feature requires ${role} access.`} />;
  }

  // Check any of multiple roles
  if (roles && user.role && !hasAnyRole(user as User, roles)) {
    return <AccessDenied title="Insufficient Permissions" message={`This feature requires one of the following roles: ${roles.join(', ')}.`} />;
  }

  // Check specific permission
  if (permission && user.role && !hasPermission(user as User, permission)) {
    return <AccessDenied title="Insufficient Permissions" message={`This feature requires ${permission} permission.`} />;
  }

  return <>{children}</>;
};

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  title = "Access Denied", 
  message = "You don't have permission to access this feature." 
}) => (
  <AccessDeniedContainer>
    <AccessDeniedIcon>
      <FaLock />
    </AccessDeniedIcon>
    <AccessDeniedTitle>{title}</AccessDeniedTitle>
    <AccessDeniedMessage>{message}</AccessDeniedMessage>
  </AccessDeniedContainer>
);

const AccessDeniedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 1rem;
`;

const AccessDeniedIcon = styled.div`
  color: #dc2626;
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const AccessDeniedTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
`;

const AccessDeniedMessage = styled.p`
  font-size: 1rem;
  color: #7f1d1d;
  margin: 0;
  line-height: 1.5;
`;
