'use client';

import styled from 'styled-components';
import { FaShieldAlt, FaLock, FaUserShield } from 'react-icons/fa';

interface SecurityBadgeProps {
  variant?: 'primary' | 'secondary' | 'compact';
  className?: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  variant = 'primary',
  className
}) => {
  return (
    <BadgeContainer variant={variant} className={className}>
      <BadgeIcon variant={variant}>
        <FaShieldAlt />
      </BadgeIcon>
      <BadgeContent variant={variant}>
        <BadgeTitle>Secure Login</BadgeTitle>
        <BadgeSubtitle variant={variant}>
          {variant === 'compact' ? '256-bit SSL' : 'Protected with 256-bit SSL encryption'}
        </BadgeSubtitle>
      </BadgeContent>
    </BadgeContainer>
  );
};

export const SecurityFeatures: React.FC = () => {
  return (
    <FeaturesContainer>
      <FeatureItem>
        <FeatureIcon>
          <FaLock />
        </FeatureIcon>
        <FeatureText>End-to-end encryption</FeatureText>
      </FeatureItem>
      
      <FeatureItem>
        <FeatureIcon>
          <FaUserShield />
        </FeatureIcon>
        <FeatureText>Privacy protected</FeatureText>
      </FeatureItem>
      
      <FeatureItem>
        <FeatureIcon>
          <FaShieldAlt />
        </FeatureIcon>
        <FeatureText>Secure authentication</FeatureText>
      </FeatureItem>
    </FeaturesContainer>
  );
};

const BadgeContainer = styled.div<{ variant: string }>`
  display: flex;
  align-items: center;
  gap: ${props => props.variant === 'compact' ? '0.5rem' : '0.75rem'};
  padding: ${props => props.variant === 'compact' ? '0.5rem 0.75rem' : '0.75rem 1rem'};
  background: ${props => props.variant === 'primary' ? '#f0f8ff' : '#f8f9fa'};
  border: 1px solid ${props => props.variant === 'primary' ? '#e6f3ff' : '#e9ecef'};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const BadgeIcon = styled.div<{ variant: string }>`
  color: #10b981;
  font-size: ${props => props.variant === 'compact' ? '1rem' : '1.25rem'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BadgeContent = styled.div<{ variant: string }>`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const BadgeTitle = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
`;

const BadgeSubtitle = styled.span<{ variant: string }>`
  font-size: ${props => props.variant === 'compact' ? '0.75rem' : '0.8rem'};
  color: #6b7280;
`;

const FeaturesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
`;

const FeatureIcon = styled.div`
  color: #10b981;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FeatureText = styled.span`
  font-weight: 500;
`;
