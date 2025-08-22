'use client';

import { useState } from 'react';
// import styled from 'styled-components';
import Gallery from '@/components/Gallery';
import { ArtworkFormModal } from '@/components/ArtworkFormModal';
import { Artwork } from '@/utils/interfaces';
import PageLayout from '../components/PageLayout';
import { getPublishedArtworkFromArtist } from '@/lib/db';

// const AddArtworkButton = styled.button`
//   display: block;
//   margin: 2rem auto;
//   padding: 1rem 2rem;
//   background-color: #96885f;
//   color: white;
//   border: none;
//   border-radius: 8px;
//   font-size: 1.1rem;
//   cursor: pointer;
//   transition: background-color 0.3s ease;

//   &:hover {
//     background-color: #7a6f4d;
//   }

//   @media (max-width: 768px) {
//     margin: 1.5rem auto;
//     padding: 0.8rem 1.5rem;
//     font-size: 1rem;
//   }
// `;

export default function ArtworkPage({ artworks }: { artworks: Artwork[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleArtworks, setVisibleArtworks] = useState<Artwork[]>(artworks);

  const handleArtworkCreated = (artwork: Artwork) => {
    setVisibleArtworks([...visibleArtworks, artwork]);
  };

  return (
    <PageLayout 
      title="Artwork"
    >
      <Gallery title="Artwork Gallery" artworks={visibleArtworks} />
      
      {/* <AddArtworkButton onClick={() => setIsModalOpen(true)}>
        Add New Artwork
      </AddArtworkButton> */}

      <ArtworkFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleArtworkCreated}
      />
    </PageLayout>
  );
}

export const getServerSideProps = async () => {
  try {
    const artworks = await getPublishedArtworkFromArtist();
    return {
      props: { artworks },
    };
  } catch (error) {
    console.error('Failed to fetch artworks:', error);
    return {
      props: { artworks: [] },
    };
  }
};
