'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { useState } from 'react';
import { FaHome, FaPalette, FaEnvelope, FaCog, FaImages, FaBars, FaTimes, FaLightbulb, FaBookmark } from 'react-icons/fa';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  rightSidebar?: React.ReactNode;
  rightSidebarOpen?: boolean;
  rightSidebarWidth?: number;
  statusBar?: React.ReactNode;
}

export function AdminLayout({ 
  children, 
  currentPage = 'dashboard',
  rightSidebar,
  rightSidebarOpen = false,
  rightSidebarWidth = 400,
  statusBar,
}: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome, href: '/admin' },
    { id: 'artwork', label: 'Artwork', icon: FaPalette, href: '/admin/artwork' },
    { id: 'tattoos', label: 'Tattoos', icon: FaBookmark, href: '/admin/tattoos' },
    { id: 'media', label: 'Media', icon: FaImages, href: '/admin/media' },
    // { id: 'users', label: 'Users', icon: FaUsers, href: '/admin/users' },
    // { id: 'events', label: 'Events', icon: FaCalendar, href: '/admin/events' },
    { id: 'inquiries', label: 'Inquiries', icon: FaEnvelope, href: '/admin/inquiries' },
    // { id: 'emails', label: 'Emails', icon: FaEnvelope, href: '/admin/emails' },
    { id: 'marketing-assistant', label: 'Marketing Assistant', icon: FaLightbulb, href: '/admin/marketing-assistant' },
    { id: 'settings', label: 'Settings', icon: FaCog, href: '/admin/settings' },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <LayoutContainer>
      <MobileOverlay 
        isOpen={isMobileMenuOpen} 
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      <Sidebar isOpen={isMobileMenuOpen}>
        <Logo>
          <Link href="/admin">
            <LogoText>Admin Panel</LogoText>
          </Link>
          <MobileCloseButton onClick={() => setIsMobileMenuOpen(false)}>
            <FaTimes />
          </MobileCloseButton>
        </Logo>
        
        <Nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <NavItem key={item.id} isActive={isActive}>
                <Link href={item.href} onClick={handleNavClick}>
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
      
      <ContentWrapper>
        <Header>
          <HeaderLeft>
            <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
              <FaBars />
            </MobileMenuButton>
            <Breadcrumb>
              {navItems.find(item => item.id === currentPage)?.label || 'Admin'}
            </Breadcrumb>
          </HeaderLeft>
          <UserMenu>
            <Link href="/">
              <BackButton>← Back to Site</BackButton>
            </Link>
          </UserMenu>
        </Header>
        
        <MainContent rightSidebarOpen={rightSidebarOpen} rightSidebarWidth={rightSidebarWidth}>
          <Content>
            {children}
          </Content>

          {statusBar && (
            <StatusBarContainer rightSidebarOpen={rightSidebarOpen} rightSidebarWidth={rightSidebarWidth}>
              {statusBar}
            </StatusBarContainer>
          )}
        </MainContent>

        {rightSidebar && rightSidebarOpen && (
          <RightSidebarContainer sidebarWidth={rightSidebarWidth}>
            {rightSidebar}
          </RightSidebarContainer>
        )}
      </ContentWrapper>
    </LayoutContainer>
  );
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
`;

const MobileOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;

  @media (min-width: 769px) {
    display: none;
  }
`;

const Sidebar = styled.aside<{ isOpen: boolean }>`
  width: 250px;
  background: white;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    width: 280px;
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

const Logo = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  cursor: pointer;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const MobileCloseButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
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

  @media (max-width: 768px) {
    padding: 1rem;
    font-size: 1.1rem;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  margin-left: 250px;
  display: flex;
  flex-direction: column;
  position: relative;
  /* Navbar spacing handled by global .navbar-visible class */

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const MainContent = styled.main<{ rightSidebarOpen?: boolean; rightSidebarWidth?: number }>`
  width: calc(100% - ${props => props.rightSidebarOpen ? `${props.rightSidebarWidth}px` : '0px'});
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
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
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #333;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Breadcrumb = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
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

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
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

const StatusBarContainer = styled.div<{ rightSidebarOpen?: boolean; rightSidebarWidth?: number }>`
  position: fixed;
  bottom: 0;
  left: 250px;
  right: ${props => props.rightSidebarOpen ? `${props.rightSidebarWidth}px` : '0'};
  transition: right 0.3s ease, width 0.3s ease;
  z-index: 90;

  @media (max-width: 768px) {
    left: 0;
    right: 0;
  }
`;

const RightSidebarContainer = styled.div<{ sidebarWidth?: number }>`
  position: fixed;
  top: 68px; /* Height of admin header */
  right: 0;
  bottom: 0;
  width: ${props => props.sidebarWidth}px;
  background: white;
  border-left: 1px solid #e9ecef;
  z-index: 95;
  overflow-y: auto;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    top: 0;
    width: 100%;
    z-index: 1001;
  }
`; 