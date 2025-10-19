'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';
import { useAuth } from '@/utils/useAuth';

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.background};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const NavbarContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: ${({ theme }) => theme.text};
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
  border-left: 1px solid ${({ theme }) => theme.border};
`;

const BreadcrumbLink = styled(Link)`
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const BreadcrumbSeparator = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.9rem;
`;

const CurrentPage = styled.span`
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  font-weight: 500;
`;

const ActionButton = styled(Link)`
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.background};
  }
`;

interface NavbarProps {
  breadcrumbs?: Array<{
    label: string;
    href: string;
  }>;
  currentPage?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function Navbar({ breadcrumbs, currentPage, action }: NavbarProps) {
  const { isAuthenticated, loading } = useAuth();

  // Add/remove navbar-visible class to body based on authentication status
  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      document.body.classList.add('navbar-visible');
    } else {
      document.body.classList.remove('navbar-visible');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('navbar-visible');
    };
  }, [isAuthenticated, loading]);

  // Don't render if not authenticated or still loading
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <NavbarContainer>
      <NavbarContent>
        <LeftSection>
          <LogoLink href="/admin">
            <Image src="/images/grow.png" alt="Grow Logo" width={24} height={24} />
          </LogoLink>
          
          {(breadcrumbs?.length || currentPage) && (
            <Breadcrumbs>
              {breadcrumbs?.map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                </React.Fragment>
              ))}
              {currentPage && <CurrentPage>{currentPage}</CurrentPage>}
            </Breadcrumbs>
          )}
        </LeftSection>
        {action && (
          <ActionButton href={action.href}>
            {action.label}
          </ActionButton>
        )}
      </NavbarContent>
    </NavbarContainer>
  );
} 