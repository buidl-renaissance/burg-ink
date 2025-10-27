'use client';

import Link from 'next/link';
import styled from 'styled-components';

interface AuthNavBarProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export const AuthNavBar: React.FC<AuthNavBarProps> = ({ 
  showBackButton = false, 
  backHref = '/', 
  backLabel = 'Back to Home' 
}) => {
  return (
    <AuthNavContainer>
      <AuthNavContent>
        <LogoSection>
          <LogoLink href="/">
            <LogoText>Burg Ink</LogoText>
          </LogoLink>
        </LogoSection>
        
        {showBackButton && (
          <BackSection>
            <BackLink href={backHref}>
              {backLabel}
            </BackLink>
          </BackSection>
        )}
      </AuthNavContent>
    </AuthNavContainer>
  );
};

const AuthNavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: white;
  border-bottom: 1px solid #e9ecef;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const AuthNavContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LogoLink = styled(Link)`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: #333;
  transition: color 0.2s ease;
  
  &:hover {
    color: #96885f;
  }
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.05em;
  line-height: 1;
`;

const LogoSubtext = styled.p`
  font-size: 0.75rem;
  color: #666;
  margin: 0;
  font-weight: 400;
  line-height: 1;
`;

const BackSection = styled.div`
  display: flex;
  align-items: center;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #96885f;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #96885f;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
