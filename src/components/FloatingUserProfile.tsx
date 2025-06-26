'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useAuth } from '@/utils/useAuth';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
  }
`;

const ProfileButton = styled.button<{ isOpen: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #96885f;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    border-width: 2px;
  }
`;

const ProfileImage = styled.img`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  
  @media (max-width: 768px) {
    width: 46px;
    height: 46px;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #96885f, #b8a87a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: 70px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(10px)'};
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    bottom: 60px;
    min-width: 180px;
  }
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s ease;
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #d32f2f;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #ffebee;
  }
`;

const UserInfo = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
  
  .user-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .user-email {
    font-size: 0.8rem;
  }
`;

const FloatingUserProfile: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <FloatingContainer ref={menuRef}>
      <ProfileButton 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile menu"
      >
        {user.profile_picture ? (
          <ProfileImage src={user.profile_picture} alt={user.name} />
        ) : (
          <DefaultAvatar>
            {getUserInitials(user.name)}
          </DefaultAvatar>
        )}
      </ProfileButton>
      
      <DropdownMenu isOpen={isOpen}>
        <UserInfo>
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
        </UserInfo>
        
        <MenuItem href="/admin" onClick={() => setIsOpen(false)}>
          <FaCog />
          Admin Panel
        </MenuItem>
        
        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </LogoutButton>
      </DropdownMenu>
    </FloatingContainer>
  );
};

export default FloatingUserProfile; 