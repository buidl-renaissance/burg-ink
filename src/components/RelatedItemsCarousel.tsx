import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CarouselItem {
  id: number;
  slug: string;
  title: string;
  image: string | null;
  type: 'artwork' | 'tattoo';
  category?: string | null;
}

interface RelatedItemsCarouselProps {
  items: CarouselItem[];
  currentItemId: number;
  title?: string;
}

export function RelatedItemsCarousel({ 
  items, 
  currentItemId,
  title = 'Related Works'
}: RelatedItemsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter out current item
  const filteredItems = items.filter(item => item.id !== currentItemId);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [filteredItems]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  if (filteredItems.length === 0) return null;

  return (
    <CarouselSection>
      <CarouselHeader>
        <CarouselTitle>{title}</CarouselTitle>
        <NavigationButtons>
          <NavButton 
            onClick={() => scroll('left')} 
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <FaChevronLeft />
          </NavButton>
          <NavButton 
            onClick={() => scroll('right')} 
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <FaChevronRight />
          </NavButton>
        </NavigationButtons>
      </CarouselHeader>

      <CarouselContainer ref={scrollContainerRef}>
        <CarouselTrack>
          {filteredItems.map((item) => (
            <CarouselCard key={`${item.type}-${item.id}`}>
              <Link href={`/${item.type === 'artwork' ? 'artwork' : 'tattoos'}/${item.slug}`}>
                <CardImageContainer>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 200px, 250px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <PlaceholderImage>No Image</PlaceholderImage>
                  )}
                  <CardOverlay>
                    <CardTitle>{item.title}</CardTitle>
                    {item.category && <CardCategory>{item.category}</CardCategory>}
                  </CardOverlay>
                </CardImageContainer>
              </Link>
            </CarouselCard>
          ))}
        </CarouselTrack>
      </CarouselContainer>
    </CarouselSection>
  );
}

const CarouselSection = styled.section`
  max-width: 1400px;
  margin: 4rem auto 2rem;

  @media (max-width: 768px) {
    margin: 3rem auto 1rem;
  }
`;

const CarouselHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const CarouselTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const NavButton = styled.button<{ disabled?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${props => props.disabled ? '#e0e0e0' : '#96885f'};
  background: ${props => props.disabled ? '#f5f5f5' : 'white'};
  color: ${props => props.disabled ? '#ccc' : '#96885f'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  font-size: 1rem;

  &:hover:not(:disabled) {
    background: #96885f;
    color: white;
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
`;

const CarouselContainer = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CarouselTrack = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0 0.5rem 2rem;

  @media (max-width: 768px) {
    padding: 0.5rem 0 0.5rem 1rem;
  }

  &::after {
    content: '';
    display: block;
    flex-shrink: 0;
    width: 2rem;

    @media (max-width: 768px) {
      width: 1rem;
    }
  }
`;

const CarouselCard = styled.div`
  flex: 0 0 auto;
  width: 250px;

  @media (max-width: 768px) {
    width: 200px;
  }
`;

const CardImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(-4px);
  }
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.9rem;
`;

const CardOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 1.5rem 1rem 1rem;
  transform: translateY(0);
  transition: transform 0.3s ease;

  ${CardImageContainer}:hover & {
    transform: translateY(-4px);
  }
`;

const CardTitle = styled.h3`
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const CardCategory = styled.p`
  color: #96885f;
  font-size: 0.85rem;
  margin: 0;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const TypeBadge = styled.span`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(150, 136, 95, 0.9);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  z-index: 1;
`;

