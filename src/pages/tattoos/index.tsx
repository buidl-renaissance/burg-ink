'use client';

import { FC } from 'react';
import styled from 'styled-components';
import { ArtworkCard, ArtworkCardClickableContainer } from '@/components/ArtworkCard';
import PageLayout, { PageContainer } from '../../components/PageLayout';
import { getAllTattoos } from '@/lib/db';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

interface Tattoo {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  artist_id: number | null;
  image: string | null;
  category: string | null;
  placement: string | null;
  size: string | null;
  style: string | null;
  meta: Record<string, unknown>;
  data: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  artist?: {
    id: number;
    name: string;
    slug: string | null;
    profile_picture: string | null;
    bio: string | null;
  };
}

interface TattoosPageProps {
  tattoos: Tattoo[];
}

const TattoosPage: FC<TattoosPageProps> = ({ tattoos }) => {
  const router = useRouter();

  const handleTattooClick = (tattoo: Tattoo) => {
    router.push(`/tattoos/${tattoo.slug}`);
  };

  // Get unique categories from tattoos
  const categories = ['All', ...new Set(tattoos.map(t => t.category).filter(Boolean) as string[])];

  return (
    <PageLayout title="Tattoo Gallery">
      <PageContainer>
        <TattooGrid>
          {tattoos.map((tattoo) => (
            <ArtworkCardClickableContainer
              key={tattoo.id}
              onClick={() => handleTattooClick(tattoo)}
            >
              <ArtworkCard 
                artwork={{
                  id: tattoo.id,
                  slug: tattoo.slug,
                  title: tattoo.title,
                  description: tattoo.description || '',
                  image: tattoo.image || '',
                  type: 'tattoo',
                  artist: tattoo.artist,
                  data: tattoo.data,
                  meta: tattoo.meta,
                  created_at: tattoo.created_at || '',
                  updated_at: tattoo.updated_at || '',
                }} 
              />
            </ArtworkCardClickableContainer>
          ))}
        </TattooGrid>
      </PageContainer>

      <InquirySection>
        <InquiryTitle>Interested in getting a tattoo?</InquiryTitle>
        <InquiryText>
          Whether you have a specific design in mind or would like to
          collaborate on a custom piece, I&apos;d love to hear from you. Please
          reach out to discuss your ideas, pricing, and availability.
        </InquiryText>
        <InquiryButton>Book a Consultation</InquiryButton>
      </InquirySection>
    </PageLayout>
  );
};

export default TattoosPage;

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const tattoos = await getAllTattoos();
    return {
      props: {
        tattoos: JSON.parse(JSON.stringify(tattoos)), // Serialize for Next.js
      },
    };
  } catch (error) {
    console.error('Failed to fetch tattoos:', error);
    return {
      props: {
        tattoos: [],
      },
    };
  }
};

const TattooGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
`;

const InquirySection = styled.div`
  margin-top: 4rem;
  text-align: center;
  padding: 2rem;
  background-color: #f8f8f8;
  border-radius: 8px;

  @media (max-width: 768px) {
    margin-top: 2rem;
    padding: 1.5rem 1rem;
    border-radius: 6px;
  }
`;

const InquiryTitle = styled.h3`
  margin-bottom: 1rem;
  font-size: 1.8rem;

  @media (max-width: 768px) {
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }
`;

const InquiryText = styled.p`
  margin-bottom: 1.5rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
`;

const InquiryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #96885f;
  color: white;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.3s ease;

  &:hover {
    background-color: #7a6e4e;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
`;

