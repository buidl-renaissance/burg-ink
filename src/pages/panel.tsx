"use client";

import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import Hero from "@/components/Hero";

const StyledPage = styled.div`
  margin: 0 auto;
`;

const QRCodeSection = styled.div`
  text-align: center;
  padding: 12rem 2rem;
  background-color: #333;

  @media (max-width: 768px) {
    padding: 2.5rem 1rem;
  }
`;

const QRCodeContainer = styled.div`
  max-width: 420px;
  margin: 0 auto;
`;

const QRCodeTitle = styled.h2`
  font-size: 2.5rem;
  font-family: "Marcellus", serif;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0.025em;
  margin-bottom: 1.5rem;
  color: #fff;
  position: relative;
  display: inline-block;
  padding: 0 70px;

  &::before,
  &::after {
    content: "";
    display: block;
    width: 50px;
    height: 2px;
    background: #96885f;
    position: absolute;
    top: 50%;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  @media (max-width: 768px) {
    font-size: 1.8rem;
    padding: 0 40px;
    margin-bottom: 1rem;

    &::before,
    &::after {
      width: 30px;
    }
  }
`;

const QRCodeText = styled.p`
  font-size: 1.1rem;
  font-family: "Marcellus", serif;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #fff;

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
`;

const QRCodeWrapper = styled.div`
  display: inline-block;
  padding: 0.25rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 8px;
  }
`;

const AboutSection = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  position: relative;
  background-color: #f5f5f5;

  @media (max-width: 768px) {
    padding: 2.5rem 1rem;
  }
`;

const AboutContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const AboutTitle = styled.h2`
  font-size: 3rem;
  font-family: "Marcellus", serif;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0.025em;
  margin-bottom: 1.5rem;
  color: #333;
  position: relative;
  display: inline-block;
  padding: 0 70px;

  &::before,
  &::after {
    content: "";
    display: block;
    width: 50px;
    height: 2px;
    background: #96885f;
    position: absolute;
    top: 50%;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    padding: 0 40px;
    margin-bottom: 1rem;

    &::before,
    &::after {
      width: 30px;
    }
  }
`;

const AboutText = styled.p`
  font-size: 1.2rem;
  font-family: "Marcellus", serif;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #555;

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
`;

const MoreLink = styled.a`
  padding: 0.5rem 2rem;
  color: #333;
  background-color: transparent;
  border: 4px solid #96885f;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  display: inline-block;
  text-decoration: none;

  &:hover {
    background-color: rgba(150, 136, 95, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 1.5rem;
    font-size: 1rem;
    border-width: 3px;
  }
`;

export default function Panel() {
  return (
    <StyledPage>
      <Hero />
      
      <AboutSection>
        <AboutContainer>
          <AboutTitle>About the Artist</AboutTitle>
          <AboutText>
            Through tattooing, painting, and healing arts, Andrea Burg creates work as a living ceremony—an offering to nature, spirit, and the beauty that connects all beings. Her art is both a reflection of the Earth and an invitation to remember our own place within it.
          </AboutText>
          <MoreLink href="/about">More about the artist</MoreLink>
        </AboutContainer>
      </AboutSection>

      <QRCodeSection>
        <QRCodeContainer>
          <QRCodeTitle>Get In Touch</QRCodeTitle>
          <QRCodeText>
            For inquiries about commissions or available works.
          </QRCodeText>
          <QRCodeWrapper>
            <QRCodeSVG
              value={`https://burg-ink.vercel.app/inquire`}
              size={420}
              level="M"
              includeMargin={true}
            />
          </QRCodeWrapper>
        </QRCodeContainer>
      </QRCodeSection>
    </StyledPage>
  );
}
