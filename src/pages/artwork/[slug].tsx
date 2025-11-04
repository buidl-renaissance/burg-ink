import styled from 'styled-components';
import { getArtworkBySlug, getPublishedArtworkFromArtist, getLinkedWorks, LinkedWork } from '@/lib/db';
import { Artwork } from '@/utils/interfaces';
import Head from 'next/head';
import PageLayout from '@/components/PageLayout';
import Image from 'next/image';
import { RelatedItemsCarousel } from '@/components/RelatedItemsCarousel';

interface ArtworkDetailPageProps {
  artwork: Artwork;
  relatedWorks: LinkedWork[];
  otherArtworks: LinkedWork[];
}

export default function ArtworkDetailPage({ artwork, relatedWorks, otherArtworks }: ArtworkDetailPageProps) {
  return (
    <PageLayout>
      <Head>
        <title>{artwork.title} | Artwork Gallery</title>
        <meta name="description" content={artwork.description} />
      </Head>

      <ArtworkContainer>
        <ImageContainer>
          {artwork.image && (
            <Image 
              src={artwork.image} 
              alt={artwork.title}
              width={800}
              height={600}
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </ImageContainer>

        <ArtworkDetails>
          <ArtworkTitle>{artwork.title}</ArtworkTitle>
          <Description>{artwork.description}</Description>

          <MetaInfo>
            {artwork.data?.category && (
              <MetaItem>
                <span>Category:</span> {artwork.data.category}
              </MetaItem>
            )}
            {artwork.collaborators && artwork.collaborators.length > 0 && (
              <MetaItem>
                <span>Collaborators:</span>
                {artwork.collaborators
                  .map((collaborator) => collaborator.name)
                  .join(', ')}
              </MetaItem>
            )}
          </MetaInfo>
        </ArtworkDetails>
      </ArtworkContainer>

      {relatedWorks.length > 0 && (
        <RelatedItemsCarousel
          items={relatedWorks}
          currentItemId={artwork.id}
          title="Related Works"
        />
      )}

      {otherArtworks.length > 0 && (
        <RelatedItemsCarousel
          items={otherArtworks}
          currentItemId={artwork.id}
          title="More Artwork"
        />
      )}
    </PageLayout>
  );
}

export const getMetadata = async (artwork: Artwork) => {
  return {
    title: `${artwork.title} | ${artwork.artist?.name || 'Artwork Gallery'}`,
    description:
      artwork.description || 'View this beautiful artwork in our gallery',
    openGraph: {
      title: artwork.title,
      description:
        artwork.description || 'View this beautiful artwork in our gallery',
      images: [
        {
          url: artwork.image || '',
          width: 1200,
          height: 630,
          alt: artwork.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: artwork.title,
      description:
        artwork.description || 'View this beautiful artwork in our gallery',
      images: [artwork.image || ''],
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
    const artwork = await getArtworkBySlug(slug, true);
    
    if (!artwork) {
      return {
        notFound: true,
      };
    }

    // Fetch linked works (manually linked items)
    let relatedWorks: LinkedWork[] = [];
    try {
      relatedWorks = await getLinkedWorks('artwork', artwork.id);
    } catch (error) {
      console.error('Failed to fetch linked works:', error);
    }

    // Fetch other artworks for discovery (excluding current and linked works)
    const allArtworks = await getPublishedArtworkFromArtist();
    const linkedIds = new Set(relatedWorks.filter(w => w.type === 'artwork').map(w => w.id));
    const otherArtworks: LinkedWork[] = allArtworks
      .filter((item: Artwork) => item.id !== artwork.id && !linkedIds.has(item.id))
      .slice(0, 12)
      .map((item: Artwork) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        image: item.image || null,
        type: 'artwork' as const,
        category: item.data?.category as string | null || null,
      }));
    
    const metadata = await getMetadata(artwork);
    return { props: { artwork, relatedWorks, otherArtworks, metadata } };
  } catch (error) {
    console.error('Failed to fetch artwork:', error);
    return {
      notFound: true,
    };
  }
};

const ArtworkContainer = styled.div`
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

const ArtworkDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ArtworkTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 2rem;
`;

const MetaInfo = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const MetaItem = styled.div`
  margin-bottom: 1rem;

  span {
    font-weight: 500;
    color: #333;
    margin-right: 0.5rem;
  }
`;
