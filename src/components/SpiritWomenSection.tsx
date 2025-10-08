'use client';

import { FC } from 'react';
import styled from 'styled-components';

const SectionContainer = styled.div`
  text-align: center;
  margin-bottom: 0;
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
  padding-top: 4rem;
`;

const BackgroundVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: -1;
`;

const FallbackBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  z-index: -2;
`;

const Title = styled.h2`
  margin-bottom: 0.5rem;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
  font-size: 4rem;
  font-family: 'Marcellus', serif;
  font-weight: 400;
  font-style: normal;
  line-height: 1em;
  text-decoration: none;
  text-transform: none;
  letter-spacing: 0.025em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 0.3rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  font-family: 'Marcellus', serif;
  color: #fff;
  max-width: 600px;
  margin: 0 auto 2rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  z-index: 1;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    max-width: 90%;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const DecorativeLine = styled.div`
  width: 600px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #96885f, #d4af37, #96885f, transparent);
  margin: 0.3rem auto;
  z-index: 1;
  border-radius: 2px;
  
  @media (max-width: 768px) {
    width: 200px;
    height: 2px;
    margin: 0.2rem auto;
  }
  
  @media (max-width: 480px) {
    width: 250px;
    height: 2px;
    margin: 0.15rem auto;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  z-index: 1;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1.5rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.6rem;
    margin-top: 1.2rem;
  }
`;

const ActionButton = styled.a`
  padding: 0.5rem 2rem;
  color: #e1e1e1;
  background-color: transparent;
  border: 4px solid #96885f;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  text-decoration: none;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 1.5rem;
    font-size: 1rem;
    border-width: 3px;
    width: 200px;
  }
  
  @media (max-width: 480px) {
    padding: 0.3rem 1.2rem;
    font-size: 0.9rem;
    border-width: 2px;
    width: 180px;
  }
`;

interface SpiritWomenSectionProps {
  title?: string;
  subtitle?: string;
  videoSrc?: string;
}

const SpiritWomenSection: FC<SpiritWomenSectionProps> = ({
  title = 'The Sacred Path',
  subtitle = 'Channeling ancestral wisdom through contemporary expression',
  videoSrc = 'https://dpop.nyc3.digitaloceanspaces.com/uploads/spirit-women-d9daaa52-1755475602118.mov',
}) => {

  return (
    <SectionContainer>
      <FallbackBackground />
      <BackgroundVideo 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
      </BackgroundVideo>
      <VideoOverlay />
      <Title>{title}</Title>
      <DecorativeLine />
      <Subtitle>{subtitle}</Subtitle>
      <ActionButtons>
        <ActionButton href="/artwork">View Artwork</ActionButton>
        <ActionButton href="/inquire">Commission</ActionButton>
      </ActionButtons>
    </SectionContainer>
  );
};

export default SpiritWomenSection;
