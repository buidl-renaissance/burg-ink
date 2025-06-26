'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { FaHome, FaPalette, FaUsers, FaCalendar, FaEnvelope, FaCog } from 'react-icons/fa';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export function AdminLayout({ children, currentPage = 'dashboard' }: AdminLayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome, href: '/admin' },
    { id: 'artwork', label: 'Artwork', icon: FaPalette, href: '/admin/artwork' },
    { id: 'users', label: 'Users', icon: FaUsers, href: '/admin/users' },
    { id: 'events', label: 'Events', icon: FaCalendar, href: '/admin/events' },
    { id: 'emails', label: 'Emails', icon: FaEnvelope, href: '/admin/emails' },
    { id: 'settings', label: 'Settings', icon: FaCog, href: '/admin/settings' },
  ];

  return (
    <LayoutContainer>
      <Sidebar>
        <Logo>
          <Link href="/admin">
            <LogoText>Admin Panel</LogoText>
          </Link>
        </Logo>
        
        <Nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <NavItem key={item.id} isActive={isActive}>
                <Link href={item.href}>
                  <NavLink>
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                </Link>
              </NavItem>
            );
          })}
        </Nav>
      </Sidebar>
      
      <MainContent>
        <Header>
          <Breadcrumb>
            {navItems.find(item => item.id === currentPage)?.label || 'Admin'}
          </Breadcrumb>
          <UserMenu>
            <Link href="/">
              <BackButton>← Back to Site</BackButton>
            </Link>
          </UserMenu>
        </Header>
        
        <Content>
          {children}
        </Content>
      </MainContent>
    </LayoutContainer>
  );
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
`;

const Sidebar = styled.aside`
  width: 250px;
  background: white;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;

  @media (max-width: 768px) {
    width: 200px;
  }
`;

const Logo = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  cursor: pointer;
`;

const Nav = styled.nav`
  flex: 1;
  padding: 1rem 0;
`;

const NavItem = styled.div<{ isActive: boolean }>`
  margin: 0.25rem 1rem;
  border-radius: 8px;
  background: ${props => props.isActive ? '#96885f' : 'transparent'};
  
  a {
    text-decoration: none;
    color: ${props => props.isActive ? 'white' : '#333'};
  }
`;

const NavLink = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(150, 136, 95, 0.1);
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 250px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    margin-left: 200px;
  }
`;

const Header = styled.header`
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Breadcrumb = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  text-decoration: none;
  display: inline-block;

  &:hover {
    background: #7a6f4d;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`; 