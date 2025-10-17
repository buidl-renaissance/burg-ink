import styled from 'styled-components';
import { getTattooBySlug } from '@/lib/db';
import Head from 'next/head';
import PageLayout from '@/components/PageLayout';
import Image from 'next/image';

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
  embedding?: unknown;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  artist?: {
    id: number;
    name: string;
    slug: string | null;
    profile_picture: string | null;
    bio: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
  };
}

interface TattooDetailPageProps {
  tattoo: Tattoo;
}

export default function TattooDetailPage({ tattoo }: TattooDetailPageProps) {
  return (
    <PageLayout>
      <Head>
        <title>{tattoo.title} | Tattoo Gallery</title>
        <meta name="description" content={tattoo.description || ''} />
      </Head>

      <TattooContainer>
        <ImageContainer>
          {tattoo.image && (
            <Image 
              src={tattoo.image} 
              alt={tattoo.title}
              width={800}
              height={600}
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </ImageContainer>

        <TattooDetails>
          <TattooTitle>{tattoo.title}</TattooTitle>
          {tattoo.artist && <ArtistName>by {tattoo.artist.name}</ArtistName>}
          {tattoo.description && <Description>{tattoo.description}</Description>}

          <MetaInfo>
            {tattoo.category && (
              <MetaItem>
                <span>Category:</span> {tattoo.category}
              </MetaItem>
            )}
            {tattoo.placement && (
              <MetaItem>
                <span>Placement:</span> {tattoo.placement}
              </MetaItem>
            )}
            {tattoo.size && (
              <MetaItem>
                <span>Size:</span> {tattoo.size}
              </MetaItem>
            )}
            {tattoo.style && (
              <MetaItem>
                <span>Style:</span> {tattoo.style}
              </MetaItem>
            )}
          </MetaInfo>
        </TattooDetails>
      </TattooContainer>
    </PageLayout>
  );
}

export const getMetadata = async (tattoo: Tattoo) => {
  return {
    title: `${tattoo.title} | ${tattoo.artist?.name || 'Tattoo Gallery'}`,
    description:
      tattoo.description || 'View this beautiful tattoo in our gallery',
    openGraph: {
      title: tattoo.title,
      description:
        tattoo.description || 'View this beautiful tattoo in our gallery',
      images: [
        {
          url: tattoo.image || '',
          width: 1200,
          height: 630,
          alt: tattoo.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: tattoo.title,
      description:
        tattoo.description || 'View this beautiful tattoo in our gallery',
      images: [tattoo.image || ''],
    },
  };
};

export const getServerSideProps = async ({
  params,
}: {
  params: { slug: string };
}) => {
  try {
    const { slug } = params;
    const tattoo = await getTattooBySlug(slug);
    
    if (!tattoo) {
      return {
        notFound: true,
      };
    }
    
    const metadata = await getMetadata(tattoo);
    return { props: { tattoo, metadata } };
  } catch (error) {
    console.error('Failed to fetch tattoo:', error);
    return {
      notFound: true,
    };
  }
};

const TattooContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 0 1rem;
  }
`;

const ImageContainer = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const TattooDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const TattooTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0rem;
  color: #333;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ArtistName = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #96885f;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 0rem;
`;

const MetaInfo = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  display: none;
`;

const MetaItem = styled.div`
  margin-bottom: 0.25rem;
  display: flex;

  span {
    font-weight: 500;
    color: #333;
    margin-right: 0.5rem;
  }
`;

