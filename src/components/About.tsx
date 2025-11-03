'use client';

import { FC } from 'react';
import styled from 'styled-components';

const StyledPage = styled.div`
  background-color: #f5f5f5;
`;

const AboutContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 8rem 2rem;
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    padding-top: 8rem; /* Increased top padding on mobile */
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
    padding-top: 10rem; /* Increased top padding for very small screens */
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

const Section = styled.section`
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const SectionHeading = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
`;

const SubsectionHeading = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  margin-top: 2rem;
  color: #96885f;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 0.8rem;
  color: #444;
  padding-left: 1.5rem;
  position: relative;
  
  &::before {
    content: '•';
    color: #96885f;
    font-weight: bold;
    position: absolute;
    left: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 0.6rem;
    padding-left: 1.2rem;
  }
`;

const DescriptionItem = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  color: #444;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const BulletList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1.5rem 0;
  
  @media (max-width: 768px) {
    margin: 0.4rem 0 1rem 0;
  }
`;

const BulletItem = styled.li`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 0.5rem;
  color: #444;
  padding-left: 1.5rem;
  position: relative;
  
  &::before {
    content: '—';
    color: #96885f;
    position: absolute;
    left: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 0.4rem;
    padding-left: 1.2rem;
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

        <Section>
          <SectionHeading>Education & Training</SectionHeading>
          <List>
            <ListItem>Drum Camp Support, Lone Star Sundance Ceremony — 9-day Indigenous ceremony, 2023, 2025</ListItem>
            <ListItem>Peruvian Andes Shamanic Training — 15-month intensive study in Andean spiritual practices for healing, 2024</ListItem>
            <ListItem>Vision Quester Participant (Hanblecheya Ceremony) — 4-day and 4-night prayerful isolation, 2024</ListItem>
            <ListItem>Moon Dance Ceremony Participant — 5-day prayer ceremony honoring feminine energy, 2024</ListItem>
            <ListItem>Fire Keeper & Community Support, Colombia Sundance Ceremony — 9-day Indigenous ceremony, 2024</ListItem>
            <ListItem>Animal Reiki Certification, 2024</ListItem>
            <ListItem>Usui/Holy Fire Reiki Levels 1 & 2, 2021</ListItem>
            <ListItem>Inipi Ceremony Participant — ongoing monthly sweat lodge ceremonies, 2021–Present</ListItem>
            <ListItem>Ayahuasca Ceremonies — 18 plant medicine ceremonies, Costa Rica, 2020–2022</ListItem>
            <ListItem>Spiritual Coaching Training — intuitive channeling and esoteric healing practices, 2019–2021</ListItem>
            <ListItem>Bachelor of Fine Arts in Illustration — College for Creative Studies, Detroit, MI, 2016</ListItem>
          </List>
        </Section>

        <Section>
          <SectionHeading>Exhibitions & Projects</SectionHeading>
          
          <SubsectionHeading>Group Exhibitions</SubsectionHeading>
          <List>
            <ListItem>Murals in the Market, Detroit MI — 2025</ListItem>
            <ListItem>Arts For the Earth Fundraiser, Detroit MI — 2025</ListItem>
            <ListItem>A Window Into, Laventana, Detroit MI — 2025</ListItem>
            <ListItem>Lincoln Street Art Park, Detroit MI — 2025</ListItem>
            <ListItem>ArtClvb Studio Deals, Detroit, MI — 2024</ListItem>
            <ListItem>Raven Cafe, Port Huron, MI — 2024</ListItem>
            <ListItem>Eastern Market After Dark, Detroit, MI — 2023</ListItem>
            <ListItem>Dirty Show, Detroit, MI — 2023, 2016</ListItem>
            <ListItem>Build Your Block (Community Fundraiser), Detroit, MI — 2020</ListItem>
            <ListItem>Iconic Tattoo Holiday Show, Detroit, MI — 2019</ListItem>
            <ListItem>Raw Detroit, St. Andrew&apos;s Hall, Detroit, MI — 2018</ListItem>
            <ListItem>The Printer&apos;s Devil, Scarab Club, Detroit, MI — 2016</ListItem>
            <ListItem>Student Exhibition, CCS, Detroit, MI — 2016</ListItem>
          </List>

          <SubsectionHeading>Murals & Public Art</SubsectionHeading>
          <List>
            <ListItem>Moon Lodge - Lone Star Sundance Ceremony, Lampasas, TX — 2025</ListItem>
            <ListItem>Commissioned Midnight Temple Trailer, Detroit, MI — 2024</ListItem>
            <ListItem>Mural at Tangent Gallery, Detroit, MI — 2024</ListItem>
            <ListItem>Commissioned Mural (5 acrylic woodcut paintings, 3&apos;x5&apos; each), Peterboro, Detroit, MI — 2022</ListItem>
          </List>

          <SubsectionHeading>Live Art & Body Painting</SubsectionHeading>
          <List>
            <ListItem>Black Water Tattoo Convention, Port Huron, MI — 2025</ListItem>
            <ListItem>Spotlite, Willis Show Bar, Lincoln Factory, Eastern Market, Detroit, MI — 2024-2025</ListItem>
            <ListItem>Youth Face painting, Richmond, MI — 2011, 2023-2025</ListItem>
            <ListItem>Dia De Los Muertos, TV Lounge, Detroit, MI — 2024</ListItem>
            <ListItem>Community Block Party, SitonitDetroit, Detroit, MI — 2024</ListItem>
            <ListItem>Spoons, Detroit, MI — 2024</ListItem>
          </List>

          <SubsectionHeading>Tattoo Conventions</SubsectionHeading>
          <DescriptionItem>Tattooed and showcased original art and designs at 11 events, Detroit & Chicago — 2018–2025</DescriptionItem>
        </Section>

        <Section>
          <SectionHeading>Charity & Fundraising Projects</SectionHeading>
          <BulletList>
            <BulletItem>
              <strong>Arts for the Earth, Detroit, MI — 2025</strong>
              <br />
              Curated and created a fundraising event supporting local business&apos; and artist raising $2,800 for water protection groups
            </BulletItem>
            <BulletItem>
              <strong>Palestine Fundraiser Tattooing, Vamanos, Detroit, MI — 2024</strong>
              <br />
              Raised over $10,000
            </BulletItem>
            <BulletItem>
              <strong>Tattoo raffles supporting tree-planting initiatives</strong>
              <br />
              Raised $1,200, planting over 500 trees — 2020
            </BulletItem>
            <BulletItem>Long-term donor to Greenpeace and World Wildlife Fund — 8 years</BulletItem>
            <BulletItem>Sponsored three wolves at a Colorado sanctuary and volunteered — 2022</BulletItem>
            <BulletItem>Youth art volunteer — canvas creation and face painting at multiple events</BulletItem>
          </BulletList>
        </Section>

        <Section>
          <SectionHeading>Creative & Spiritual Travel Experiences</SectionHeading>
          <BulletList>
            <BulletItem>
              <strong>Colombia — 2024:</strong> 4-week cultural and ceremonial immersion, connecting ancestral traditions to art
            </BulletItem>
            <BulletItem>
              <strong>Costa Rica — 2020:</strong> 3-week exploration with rainforest conservationist; plant medicine and ecological learning
            </BulletItem>
            <BulletItem>
              <strong>Indonesia, Vietnam, Thailand — 2019:</strong> 6-week exploration of sacred spaces, cultural practices, and wildlife sanctuaries
            </BulletItem>
            <BulletItem>
              <strong>United States Sacred Sites Road Trip — 2017:</strong> 6-week journey exploring sacred sites for meditation and connection with the Earth
            </BulletItem>
          </BulletList>
        </Section>

        <Section>
          <SectionHeading>Professional Experience</SectionHeading>
          <BulletList>
            <BulletItem>
              <strong>Tattoo Artist</strong>, 313 Ink Collective, Dharma Tattoo Collective, Iconic Tattoo, Stained Glass Tattoo, Detroit, MI — 2015–Present
            </BulletItem>
            <BulletItem>
              <strong>Tattoo Convention Artist</strong> — Toledo, OH; Grand Rapids, MI; Port Huron, MI — 2020–2025
            </BulletItem>
            <BulletItem>
              <strong>Whitewater Rafting Guide</strong>, American Adventure Expeditions, Buena Vista, CO — 2022
            </BulletItem>
            <BulletItem>
              <strong>Conservationist & Mountain Trail Builder</strong>, Rocky Mountain Youth Corps, CO — 2013
            </BulletItem>
          </BulletList>
        </Section>

        <Section>
          <SectionHeading>Honors & Awards</SectionHeading>
          <List>
            <ListItem>College for Creative Studies Scholarship — 2012</ListItem>
            <ListItem>Dean&apos;s List — College for Creative Studies 2012, Lansing Community College 2009–2011</ListItem>
            <ListItem>Student Spotlight Award, Lansing Community College — 2011</ListItem>
            <ListItem>Summa Cum Laude, Lansing Community College — 2011</ListItem>
            <ListItem>Gold Key Scholastic Art & Writing Awards for Photography — 2008</ListItem>
          </List>
        </Section>

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
