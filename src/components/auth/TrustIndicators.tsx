'use client';

import styled from 'styled-components';
import { FaUsers, FaHeart, FaStar } from 'react-icons/fa';

interface TrustIndicatorsProps {
  userCount?: number;
  className?: string;
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  userCount = 2500,
  className
}) => {
  return (
    <TrustContainer className={className}>
      <TrustItem>
        <TrustIcon>
          <FaUsers />
        </TrustIcon>
        <TrustText>
          <TrustNumber>{userCount.toLocaleString()}+</TrustNumber>
          <TrustLabel>artists trust us</TrustLabel>
        </TrustText>
      </TrustItem>
      
      <TrustItem>
        <TrustIcon>
          <FaHeart />
        </TrustIcon>
        <TrustText>
          <TrustNumber>99.9%</TrustNumber>
          <TrustLabel>uptime guarantee</TrustLabel>
        </TrustText>
      </TrustItem>
      
      <TrustItem>
        <TrustIcon>
          <FaStar />
        </TrustIcon>
        <TrustText>
          <TrustNumber>4.9/5</TrustNumber>
          <TrustLabel>user rating</TrustLabel>
        </TrustText>
      </TrustItem>
    </TrustContainer>
  );
};

export const SocialProof: React.FC = () => {
  return (
    <SocialProofContainer>
      <SocialProofText>
        Join thousands of artists who have grown their audience with our platform
      </SocialProofText>
      <TestimonialQuote>
        &quot;Burg Ink helped me connect with art lovers worldwide. My sales increased by 300%!&quot;
      </TestimonialQuote>
      <TestimonialAuthor>- Sarah M., Digital Artist</TestimonialAuthor>
    </SocialProofContainer>
  );
};

export const PrivacyReassurance: React.FC = () => {
  return (
    <PrivacyContainer>
      <PrivacyText>
        🔒 We&apos;ll never share your email or personal information with third parties.
        <PrivacyLink href="/privacy">Learn more</PrivacyLink>
      </PrivacyText>
    </PrivacyContainer>
  );
};

const TrustContainer = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e9ecef;
`;

const TrustItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
`;

const TrustIcon = styled.div`
  color: #96885f;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const TrustText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const TrustNumber = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #333;
`;

const TrustLabel = styled.span`
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const SocialProofContainer = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SocialProofText = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1rem 0;
  font-weight: 500;
`;

const TestimonialQuote = styled.blockquote`
  font-size: 1rem;
  font-style: italic;
  color: #374151;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
  
  &::before {
    content: '"';
    font-size: 1.5rem;
    color: #96885f;
    margin-right: 0.25rem;
  }
  
  &::after {
    content: '"';
    font-size: 1.5rem;
    color: #96885f;
    margin-left: 0.25rem;
  }
`;

const TestimonialAuthor = styled.cite`
  font-size: 0.85rem;
  color: #6b7280;
  font-style: normal;
  font-weight: 500;
`;

const PrivacyContainer = styled.div`
  padding: 0.75rem;
  background: #f0f8ff;
  border: 1px solid #e6f3ff;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

const PrivacyText = styled.p`
  font-size: 0.85rem;
  color: #374151;
  margin: 0;
  line-height: 1.4;
`;

const PrivacyLink = styled.a`
  color: #96885f;
  text-decoration: none;
  font-weight: 500;
  margin-left: 0.25rem;
  
  &:hover {
    text-decoration: underline;
  }
`;
