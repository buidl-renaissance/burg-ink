'use client';

import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import ArtworkModal from './artwork-modal';
import { Artwork } from '@/utils/interfaces';
import { ArtworkCardClickableContainer, ArtworkCard } from '@/components/ArtworkCard';


interface GalleryProps {
  title?: string;
  artworks: Artwork[];
}

const Gallery: FC<GalleryProps> = ({ title = 'Performance Art', artworks }) => {
  const categories = [
    'All',
    ...new Set(artworks.map((artwork) => artwork.data?.category)),
  ];
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState<Artwork | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredArtworks =
    activeCategory === 'All'
      ? artworks
      : artworks.filter((artwork) => artwork.data?.category === activeCategory);

  const handleArtworkClick = (artwork: Artwork, index: number) => {
    setCurrentArtwork(artwork);
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < filteredArtworks.length) {
      setCurrentIndex(newIndex);
      setCurrentArtwork(filteredArtworks[newIndex]);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <GalleryContainer>
      <GalleryTitle>{title}</GalleryTitle>
      {/* <CategoryTabs>
        {categories.map((category, index) => (
          <CategoryTab
            key={index}
            active={activeCategory === category}
            onClick={() => setActiveCategory(category ?? 'All')}
          >
            {category}
          </CategoryTab>
        ))}
      </CategoryTabs> */}
      <GalleryGrid>
        {filteredArtworks.map((artwork: Artwork, index: number) => (
          <ArtworkCardClickableContainer key={index} onClick={() => handleArtworkClick(artwork, index)}>
            <ArtworkCard artwork={artwork} />
          </ArtworkCardClickableContainer>
        ))}
      </GalleryGrid>

      <ArtworkModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        currentArtwork={currentArtwork}
        artworks={filteredArtworks}
        currentIndex={currentIndex}
        onNavigate={handleNavigate}
      />
    </GalleryContainer>
  );
};

export default Gallery;

const GalleryContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;

const GalleryTitle = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
`;
