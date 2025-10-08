'use client';

import { FC } from 'react';
import styled from 'styled-components';

const HeroContainer = styled.div`
  text-align: center;
  margin-bottom: 0;
  position: relative;
  height: 100vh;
  max-height: 1200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
  padding-top: 4rem;
  
  @media (max-width: 768px) {
    padding-top: 2rem;
  }
  
  @media (max-width: 480px) {
    padding-top: 1.5rem;
    height: 60vh;
  }
`;

const HeroVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
`;

const HeroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  z-index: -1;
`;

const Title = styled.h1`
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
  font-size: 5.625rem;
  font-family: 'Marcellus', serif;
  font-weight: 400;
  font-style: normal;
  line-height: 1em;
  text-decoration: none;
  text-transform: none;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  
  @media (max-width: 768px) {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2.5rem;
    margin-bottom: 0.4rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.4rem;
  font-family: 'Marcellus', serif;
  color: #fff;
  max-width: 700px;
  margin: 0 auto 2rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  z-index: 1;
  text-transform: uppercase;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    max-width: 90%;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const ArtistName = styled.div`
  font-size: 2rem;
  font-family: 'Marcellus', serif;
  color: #fff;
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
  text-transform: uppercase;
  position: relative;
  display: inline-block;
  padding: 0 70px;
  
  /* &::before,
  &::after {
    content: '';
    display: block;
    width: 50px;
    height: 2px;
    background: #fff;
    position: absolute;
    bottom: -10px;
  } */

  /* &::before {
    left: 0;
  } */

  &::after {
    right: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    padding: 0 50px;
    margin-bottom: 0.8rem;
    
    &::before,
    &::after {
      width: 35px;
      bottom: -8px;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0 40px;
    margin-bottom: 0.6rem;
    
    &::before,
    &::after {
      width: 25px;
      bottom: -6px;
    }
  }
`;

const AccentLine = styled.div`
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

const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  z-index: 1;
  
  @media (max-width: 768px) {
    gap: 0.8rem;
    margin-top: 0.8rem;
    width: 100%;
    padding: 0 1rem;
  }
  
  @media (max-width: 480px) {
    width: auto;
    gap: 0.6rem;
    margin-top: 0.6rem;
    padding: 0 0.5rem;
  }
`;

const HeroButton = styled.a`
  padding: 0.5rem 2rem;
  color: #e1e1e1;
  background-color: transparent;
  border: 4px solid #96885f;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 1.5rem;
    font-size: 1rem;
    border-width: 3px;
    flex: 1;
  }
  
  @media (max-width: 480px) {
    padding: 0.3rem 1rem;
    font-size: 0.8rem;
    border-width: 2px;
    flex: 1;
  }
`;

// const SacredPathLink = styled.a`
//   font-size: 1rem;
//   font-family: 'Marcellus', serif;
//   color: #96885f;
//   margin-top: 2.5rem;
//   text-decoration: none;
//   cursor: pointer;
//   transition: all 0.3s ease;
//   z-index: 1;
//   opacity: 0.8;
//   text-transform: uppercase;
//   text-shadow: 0 0 8px rgba(150, 136, 95, 0.3);
  
//   &:hover {
//     opacity: 1;
//     color: #fff;
//     transform: translateY(-1px);
//     text-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
//   }
  
//   @media (max-width: 768px) {
//     font-size: 0.9rem;
//     margin-top: 1.2rem;
//   }
  
//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//     margin-top: 1rem;
//   }
// `;

interface HeroProps {
  artistName?: string;
  title?: string;
  subtitle?: string;
  videoSrc?: string;
}

const Hero: FC<HeroProps> = ({
  artistName = 'Art that walks between worlds',
  title = 'Andrea Burg',
  subtitle = '',
  videoSrc = 'https://dpop.nyc3.digitaloceanspaces.com/uploads/jaguar-animation-219d55e6-1755474112949.mov',
}) => {
  return (
    <HeroContainer>
      <HeroVideo autoPlay loop muted playsInline>
        <source src={videoSrc} type="video/mp4" />
      </HeroVideo>
      <HeroOverlay />
      <Title>{title}</Title>
      <AccentLine />
      <ArtistName>{artistName}</ArtistName>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
      <HeroButtons>
        <HeroButton href="/artwork">Artwork</HeroButton>
        <HeroButton href="/tattoos">Tattoos</HeroButton>
        <HeroButton href="/inquire">Inquire</HeroButton>
      </HeroButtons>
      {/* <SacredPathLink href="/sacred-path">take the sacred path</SacredPathLink> */}
    </HeroContainer>
  );
};

export default Hero;