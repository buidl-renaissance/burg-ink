'use client';

import { FC } from 'react';
import styled from 'styled-components';

const StyledPage = styled.div`
  background-color: #f5f5f5;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const AboutContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 8rem 2rem;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const PageTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  display: inline-block;
  padding: 0 70px;
  left: 50%;
  transform: translateX(-50%);

  &::before,
  &::after {
    content: '';
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
    margin-bottom: 1.5rem;
    
    &::before,
    &::after {
      width: 30px;
    }
  }
`;

const ArtistSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin-bottom: 4rem;

  @media (min-width: 768px) {
    flex-direction: row;
  }
  
  @media (max-width: 768px) {
    gap: 2rem;
    margin-bottom: 3rem;
  }
`;

const ArtistImage = styled.img`
  width: 100%;
  max-width: 400px;
  height: auto;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  align-self: flex-start;

  @media (min-width: 768px) {
    width: 40%;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 6px;
  }
`;

const ArtistBio = styled.div`
  flex: 1;
`;

const BioHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
`;

const BioParagraph = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
  color: #444;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

const SkillsSection = styled.section`
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const SkillsHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
`;

const SkillsList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  list-style: none;
  padding: 0;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
`;

const SkillItem = styled.li`
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 6px;
    
    &:hover {
      transform: translateY(-3px);
    }
  }
`;

const SkillTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #96885f;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 0.3rem;
  }
`;

const SkillDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

const ExperienceSection = styled.section`
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const ExperienceHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
`;

const Timeline = styled.div`
  position: relative;
  max-width: 800px;
  margin: 0 auto;

  &::after {
    content: '';
    position: absolute;
    width: 2px;
    background-color: #96885f;
    top: 0;
    bottom: 0;
    left: 50%;
    margin-left: -1px;

    @media (max-width: 767px) {
      left: 31px;
    }
  }
`;

const TimelineItem = styled.div`
  padding: 10px 40px;
  position: relative;
  width: 50%;
  box-sizing: border-box;

  &:nth-child(odd) {
    left: 0;
  }

  &:nth-child(even) {
    left: 50%;
  }

  @media (max-width: 767px) {
    width: 100%;
    padding-left: 70px;
    padding-right: 25px;

    &:nth-child(odd),
    &:nth-child(even) {
      left: 0;
    }
  }
`;

const TimelineContent = styled.div`
  padding: 20px;
  background-color: white;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 6px;
  }
`;

const TimelineDate = styled.div`
  font-weight: bold;
  color: #96885f;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }
`;

const TimelineTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 8px;
  }
`;

const TimelineText = styled.p`
  margin: 0;
  line-height: 1.6;
  color: #555;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

const ContactSection = styled.section`
  text-align: center;
`;

const ContactHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
`;

const ContactText = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
`;

const ContactButton = styled.a`
  display: inline-block;
  padding: 1rem 2rem;
  background-color: transparent;
  border: 4px solid #96885f;
  color: #333;
  font-size: 1.2rem;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(150, 136, 95, 0.2);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-width: 3px;
    
    &:hover {
      transform: translateY(-1px);
    }
  }
`;

interface AboutProps {
  showTitle?: boolean;
}

const About: FC<AboutProps> = ({ showTitle = true }) => {
  return (
    <StyledPage>
      <AboutContainer>
        {showTitle && <PageTitle>About Me</PageTitle>}

        <ArtistSection>
          <ArtistImage
            src="/images/burg.ink-portrait.png"
            alt="Andrea Burg - Artist Portrait"
          />
          <ArtistBio>
            <BioHeading>Andrea Burg</BioHeading>
            <BioParagraph>
              Through tattooing, painting, and healing arts, Andrea Burg creates work as a living ceremony—an offering to nature, spirit, and the beauty that connects all beings. Her art is both a reflection of the Earth and an invitation to remember our own place within it.
            </BioParagraph>
            <BioParagraph>
              Andrea Burg is a multidisciplinary artist based in Metro Detroit and a tattooist with over a decade of experience. Having devoted tens of thousands of hours to the tattoo chair, Andrea has honed a practice rooted in precision, patience, and care. Her attention to detail reflects her love of creating images that embody the beauty of nature and capture the essence of its elements— earth, plants, animals, and universal spirit.
            </BioParagraph>
            <BioParagraph>
              Her art extends beyond tattooing into painting, printmaking, and energy healing, each medium serving as a vessel to honor the sacred connection between all beings. With a Bachelor&apos;s degree in Illustration from the College for Creative Studies, Andrea creates works that are infused with intention, ceremony, and resonance, offering art that inspires healing and reflection.
            </BioParagraph>
            <BioParagraph>
              Her journey is deeply shaped by her love of the Earth: guiding whitewater rafting trips, serving on a conservation crew restoring trails in Colorado, and organizing Arts for the Earth, a community fundraiser supporting nonprofits that protect land and water. She has also completed a 15-month training in Peruvian shamanic traditions, holds certifications in Reiki, and serves as a community member supporting and participating in Indigenous ceremonies across the Americas.
            </BioParagraph>
            <BioParagraph>
              Through her art and healing work, Andrea embraces life as a sacred ceremony. Each creation becomes an offering and invitation to remember our connection to nature, spirit, and self. She welcomes collaborations that align with healing, transformation, and the path of creation.
            </BioParagraph>
          </ArtistBio>
        </ArtistSection>

        <SkillsSection>
          <SkillsHeading>Specialties</SkillsHeading>
          <SkillsList>
            <SkillItem>
              <SkillTitle>Tattoo Art</SkillTitle>
              <SkillDescription>
                Over a decade of experience creating custom tattoos with precision, patience, and care, specializing in nature-inspired designs that honor the individual&apos;s story and connection to the Earth.
              </SkillDescription>
            </SkillItem>
            <SkillItem>
              <SkillTitle>Painting & Printmaking</SkillTitle>
              <SkillDescription>
                Creating works infused with intention, ceremony, and resonance that serve as vessels to honor the sacred connection between all beings.
              </SkillDescription>
            </SkillItem>
            <SkillItem>
              <SkillTitle>Energy Healing</SkillTitle>
              <SkillDescription>
                Certified Reiki practitioner and trained in Peruvian shamanic traditions, offering healing work that supports transformation and spiritual connection.
              </SkillDescription>
            </SkillItem>
            {/* <SkillItem>
              <SkillTitle>Community & Conservation</SkillTitle>
              <SkillDescription>
                Organizing Arts for the Earth fundraisers, guiding whitewater rafting trips, and participating in Indigenous ceremonies across the Americas.
              </SkillDescription>
            </SkillItem> */}
          </SkillsList>
        </SkillsSection>

        <ExperienceSection>
          <ExperienceHeading>Experience & Education</ExperienceHeading>
          <Timeline>
            <TimelineItem>
              <TimelineContent>
                <TimelineDate>Present</TimelineDate>
                <TimelineTitle>Multidisciplinary Artist & Tattooist</TimelineTitle>
                <TimelineText>
                  Creating work as a living ceremony through tattooing, painting, printmaking, and energy healing in Metro Detroit.
                </TimelineText>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineContent>
                <TimelineDate>2023 - Present</TimelineDate>
                <TimelineTitle>Arts for the Earth Organizer</TimelineTitle>
                <TimelineText>
                  Organizing community fundraisers supporting nonprofits that protect land and water, connecting art with environmental conservation.
                </TimelineText>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineContent>
                <TimelineDate>2022 - 2023</TimelineDate>
                <TimelineTitle>Peruvian Shamanic Training</TimelineTitle>
                <TimelineText>
                  Completed 15-month training in Peruvian shamanic traditions, deepening connection to spiritual practices and healing arts.
                </TimelineText>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineContent>
                <TimelineDate>2018 - 2020</TimelineDate>
                <TimelineTitle>Conservation Crew Member</TimelineTitle>
                <TimelineText>
                  Served on conservation crews restoring trails in Colorado, contributing to land stewardship and environmental protection.
                </TimelineText>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineContent>
                <TimelineDate>2013 - 2017</TimelineDate>
                <TimelineTitle>BFA Illustration, College for Creative Studies</TimelineTitle>
                <TimelineText>
                  Graduated with a Bachelor&apos;s degree in Illustration, developing technical skills and artistic vision that inform all creative work.
                </TimelineText>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </ExperienceSection>

        <ContactSection>
          <ContactHeading>Work With Me</ContactHeading>
          <ContactText>
            I welcome collaborations that align with healing, transformation, and the path of creation. Whether you&apos;re seeking a custom tattoo, healing session, or artistic collaboration, I&apos;d love to discuss how we can work together to honor the sacred connection between nature, spirit, and self.
          </ContactText>
          <ContactButton href="/inquire">Get In Touch</ContactButton>
        </ContactSection>
      </AboutContainer>
    </StyledPage>
  );
};

export default About;
