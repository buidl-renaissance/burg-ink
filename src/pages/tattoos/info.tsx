'use client';

import { FC } from 'react';
import styled from 'styled-components';
import PageLayout, { PageContainer } from '@/components/PageLayout';

const TattooInfoPage: FC = () => {
  return (
    <PageLayout>
      <PageContainer>
        <ContentWrapper>
          <MainTitle>Tattoo Information</MainTitle>

          <Section>
            <Paragraph>
              Hi, I&apos;m Andrea Burg, a multidisciplinary artist and tattooist with a decade of experience. 
              My work is deeply rooted in intention, energy, and transformation, blending my artistic 
              background with spiritual practices to create tattoos that embody meaning, empowerment, 
              and confidence.
            </Paragraph>
            
            <Paragraph>
              I hold a Bachelor&apos;s degree in Fine Arts from the College for Creative Studies, and my 
              artistic evolution has been profoundly shaped by my deep connection to the spiritual 
              energy of nature and my dedication to honor our Mother Earth through prayer and action. 
              Along this journey, I have received certifications in Usui/Holy Fire Reiki and Animal 
              Reiki, in addition to completing a 15-month intensive training going through the Medicine 
              Wheel, following the Shamanic Traditions of the Peruvian Andes. Through these experiences, 
              I have come to see tattooing as more than an art form—it is a sacred activation of energy, 
              a way to create harmony between body, spirit, and the natural world.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Booking & Design Process</SectionTitle>
            
            <Paragraph>
              For custom work, each tattoo is hand-drawn and one-of-a-kind, ensuring that your piece 
              is a unique reflection of your personal journey. If you&apos;re drawn to a past design, I can 
              customize it to make it truly yours.
            </Paragraph>
            
            <Paragraph>
              I periodically post available designs on Instagram (@burg.ink)—feel free to reach out if 
              one resonates with you! Pre-drawn designs are first-come, first-served and guarantee a 
              booking spot.
            </Paragraph>
            
            <Paragraph>
              For a number of reasons, I do not send out designs ahead of time but am open to a drawing 
              preview that would be scheduled prior to the appointment upon request! I always allocate 
              enough time during your appointment for minor adjustments if needed. To ensure a smooth 
              process, please include all requested information when submitting your idea.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Studio Location</SectionTitle>
            
            <HighlightBox>
              📍 2699 Guoin St, Suite 100, Detroit, MI
            </HighlightBox>
            
            <Paragraph>
              I am currently only booking in Detroit, but I am open to guest artist opportunities—contact 
              me if you&apos;d like me to visit your city!
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>Rates & Deposits</SectionTitle>
            
            <RatesList>
              <RateItem>
                <RateLabel>Hourly Rate:</RateLabel>
                <RateValue>$200</RateValue>
              </RateItem>
              <RateItem>
                <RateLabel>Minimum:</RateLabel>
                <RateValue>$200</RateValue>
              </RateItem>
              <RateItem>
                <RateLabel>Deposit:</RateLabel>
                <RateValue>$200 (non-refundable)</RateValue>
              </RateItem>
            </RatesList>
            
            <Paragraph>
              For large-scale projects that include more than one subject design (sleeves, back pieces, 
              etc.), a $500 deposit is required.
            </Paragraph>
            
            <SubsectionTitle>Your deposit secures:</SubsectionTitle>
            <BulletList>
              <li>My dedicated time and energy in designing your tattoo</li>
              <li>Your appointment slot</li>
            </BulletList>
            
            <Paragraph>
              Deposits are non-refundable but will remain valid if you provide at least 48 hours&apos; notice 
              for rescheduling.
            </Paragraph>
            
            <WarningBox>
              ❗ If you do not show up or arrive more than 20 minutes late, your deposit will be forfeited.
            </WarningBox>
            
            <InfoBox>
              💰 On a budget? Let me know so we can create a design that aligns with your means.
            </InfoBox>
          </Section>

          <Section>
            <SectionTitle>Rescheduling & Touch-Ups</SectionTitle>
            
            <Paragraph>
              <strong>Rescheduling:</strong> Please communicate with me as soon as possible if you need 
              to change your appointment.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>The Tattoo Journey</SectionTitle>
            
            <Paragraph>
              Each tattoo is a unique process, and large pieces require multiple sessions. Be patient 
              with yourself, and trust the journey. I have found that my sweet spot of tattooing to the 
              best of my ability is no more than 4 hours and a happy place for my clients to stop their 
              appointment. Please understand the focus and attention to detail that goes into tattooing 
              is a mental marathon and I honor the process by not pushing my limit for the sake of a 
              faster completion. I am happy to book follow up appointment dates after 3 weeks of healing.
            </Paragraph>
            
            <Paragraph>
              Through my work, I hope to bridge the physical and the spiritual, offering a space where 
              art, energy, and self-expression align.
            </Paragraph>
          </Section>

          <ClosingSection>
            <ClosingText>
              Ready to create something powerful together? Let&apos;s bring your vision to life.
            </ClosingText>
          </ClosingSection>
        </ContentWrapper>
      </PageContainer>
    </PageLayout>
  );
};

export default TattooInfoPage;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 0;

  @media (max-width: 768px) {
    padding: 1rem 0;
  }
`;

const MainTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #1a1a1a;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }
`;

const Section = styled.section`
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
  border-bottom: 2px solid ${({ theme }) => theme?.border || '#96885f'};
  padding-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const SubsectionTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  color: #1a1a1a;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    margin-top: 1rem;
  }
`;

const Paragraph = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
  color: #333;

  strong {
    font-weight: 600;
    color: #1a1a1a;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

const HighlightBox = styled.div`
  background-color: rgba(150, 136, 95, 0.1);
  border-left: 4px solid ${({ theme }) => theme?.border || '#96885f'};
  padding: 1.5rem;
  margin: 1.5rem 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #1a1a1a;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 1rem;
    margin: 1rem 0;
  }
`;

const RatesList = styled.div`
  background-color: rgba(150, 136, 95, 0.05);
  border: 1px solid ${({ theme }) => theme?.border || '#96885f'};
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;

  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem 0;
  }
`;

const RateItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(150, 136, 95, 0.2);

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0;
  }
`;

const RateLabel = styled.span`
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const RateValue = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.border || '#96885f'};

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const BulletList = styled.ul`
  margin: 1rem 0 1.5rem 1.5rem;
  
  li {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 0.5rem;
    color: #333;
  }

  @media (max-width: 768px) {
    margin: 0.75rem 0 1rem 1rem;
    
    li {
      font-size: 1rem;
      line-height: 1.6;
    }
  }
`;

const WarningBox = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 4px solid ${({ theme }) => theme?.error || '#ef4444'};
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  font-size: 1rem;
  color: #333;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    margin: 1rem 0;
    font-size: 0.9rem;
  }
`;

const InfoBox = styled.div`
  background-color: rgba(16, 185, 129, 0.1);
  border-left: 4px solid ${({ theme }) => theme?.success || '#10b981'};
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  font-size: 1rem;
  color: #333;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    margin: 1rem 0;
    font-size: 0.9rem;
  }
`;

const ClosingSection = styled.div`
  text-align: center;
  margin-top: 4rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(150, 136, 95, 0.1) 0%, rgba(150, 136, 95, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme?.border || '#96885f'};

  @media (max-width: 768px) {
    margin-top: 2rem;
    padding: 1.5rem 1rem;
  }
`;

const ClosingText = styled.p`
  font-size: 1.4rem;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

