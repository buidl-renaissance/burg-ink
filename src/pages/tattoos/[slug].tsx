import styled from 'styled-components';
import { getTattooBySlug, getAllTattoos } from '@/lib/db';
import Head from 'next/head';
import PageLayout from '@/components/PageLayout';
import Image from 'next/image';
import { RelatedItemsCarousel } from '@/components/RelatedItemsCarousel';

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
  relatedTattoos: Array<{
    id: number;
    slug: string;
    title: string;
    image: string | null;
    category?: string | null;
  }>;
}

export default function TattooDetailPage({ tattoo, relatedTattoos }: TattooDetailPageProps) {
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

      <RelatedItemsCarousel
        items={relatedTattoos}
        currentItemId={tattoo.id}
        itemType="tattoo"
        title="More Tattoos"
      />
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

    // Fetch related tattoos (limit to 12 items)
    const allTattoos = await getAllTattoos();
    const relatedTattoos = allTattoos
      .filter((item: Tattoo) => item.id !== tattoo.id)
      .slice(0, 12)
      .map((item: Tattoo) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        image: item.image,
        category: item.category,
      }));
    
    const metadata = await getMetadata(tattoo);
    return { props: { tattoo, relatedTattoos, metadata } };
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
  align-items: start;
  padding-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem 1rem 0;
  }
`;

const ImageContainer = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  font-size: 0;
  line-height: 0;

  img {
    display: block;
    max-width: 100%;
    height: auto;
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

