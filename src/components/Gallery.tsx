'use client';

import { FC, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { Artwork } from '@/utils/interfaces';
import { ArtworkCard } from '@/components/ArtworkCard';


interface GalleryProps {
  title?: string;
  artworks: Artwork[];
}

const Gallery: FC<GalleryProps> = ({ title = null, artworks }) => {
  const [activeCategory, ] = useState('All');

  const filteredArtworks =
    activeCategory === 'All'
      ? artworks
      : artworks.filter((artwork) => artwork.data?.category === activeCategory);

  return (
    <GalleryContainer>
      {title && <GalleryTitle>{title}</GalleryTitle>}
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
        {filteredArtworks.map((artwork: Artwork) => (
          <Link 
            key={artwork.id} 
            href={`/artwork/${artwork.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ArtworkCard artwork={artwork} />
          </Link>
        ))}
      </GalleryGrid>
    </GalleryContainer>
  );
};

export default Gallery;

const GalleryContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
`;
