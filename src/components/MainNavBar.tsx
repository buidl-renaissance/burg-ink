'use client';

import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(150, 136, 95, 0.3);
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ArtistName = styled(Link)`
  font-size: 1.5rem;
  font-family: 'Marcellus', serif;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    color: #96885f;
  }
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const AccentLine = styled.div`
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #96885f, #d4af37, #96885f, transparent);
  border-radius: 2px;
  
  @media (max-width: 768px) {
    width: 100px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 1rem;
  }
`;

const NavLink = styled(Link)<{ $isActive?: boolean }>`
  color: ${props => props.$isActive ? '#96885f' : '#e1e1e1'};
  text-decoration: none;
  font-size: 1rem;
  font-family: 'Marcellus', serif;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  position: relative;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: ${props => props.$isActive ? '100%' : '0'};
    height: 2px;
    background: #96885f;
    transition: width 0.3s ease;
  }
  
  &:hover {
    color: #fff;
    
    &::after {
      width: 100%;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

// const SacredPathLink = styled(Link)<{ $isActive?: boolean }>`
//   color: ${props => props.$isActive ? '#fff' : '#96885f'};
//   text-decoration: none;
//   font-size: 0.9rem;
//   font-family: 'Marcellus', serif;
//   text-transform: uppercase;
//   letter-spacing: 0.025em;
//   position: relative;
//   transition: all 0.3s ease;
  
//   &::after {
//     content: '';
//     position: absolute;
//     bottom: -4px;
//     left: 0;
//     width: ${props => props.$isActive ? '100%' : '0'};
//     height: 2px;
//     background: #96885f;
//     transition: width 0.3s ease;
//   }
  
//   &:hover {
//     color: #fff;
    
//     &::after {
//       width: 100%;
//     }
//   }
  
//   @media (max-width: 768px) {
//     font-size: 0.8rem;
//   }
// `;

interface MainNavBarProps {
  showOnHome?: boolean;
}

const MainNavBar: React.FC<MainNavBarProps> = ({ showOnHome = false }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  // Don't show on home page unless explicitly requested
  if (typeof window !== 'undefined' && window.location.pathname === '/' && !showOnHome) {
    return null;
  }

  return (
    <NavContainer>
      <NavContent>
        <LogoSection>
          <ArtistName href="/">Andrea Burg</ArtistName>
          <AccentLine />
        </LogoSection>
                
        <NavLinks>
          <NavLink href="/artwork" $isActive={currentPath === '/artwork' || currentPath.startsWith('/artwork/')}>
            Artwork
          </NavLink>
          <NavLink href="/tattoos" $isActive={currentPath === '/tattoos'}>
            Tattoos
          </NavLink>
          <NavLink href="/inquire" $isActive={currentPath === '/inquire'}>
            Inquire
          </NavLink>
          {/* <SacredPathLink href="/sacred-path" $isActive={currentPath === '/sacred-path'}>
            Sacred Path
          </SacredPathLink> */}
        </NavLinks>
      </NavContent>
    </NavContainer>
  );
};

export default MainNavBar;
