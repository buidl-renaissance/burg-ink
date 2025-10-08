'use client';

import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Artwork } from '@/utils/interfaces';
import { convertDefaultToResized } from '@/utils/image';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.visible {
    opacity: 1;
  }
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 800px) {
    flex-direction: column;
    max-height: 95%;
  }
`;

const ImageContainer = styled.div`
  flex: 1;
  max-width: 70%;
  position: relative;
  background-color: black;
  
  @media (max-width: 800px) {
    max-width: 100%;
    max-height: 60vh;
  }
`;

const ModalImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  max-height: 90vh;
  object-fit: contain;
  
  @media (max-width: 800px) {
    max-height: 60vh;
  }
`;

const ModalVideo = styled.video`
  display: block;
  width: 100%;
  height: 100%;
  max-height: 90vh;
  object-fit: contain;
  
  @media (max-width: 800px) {
    max-height: 60vh;
  }
`;

const InfoPanel = styled.div`
  flex: 0 0 400px;
  padding: 30px;
  background-color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  
  @media (max-width: 800px) {
    flex: none;
    padding: 20px;
    max-height: 35vh;
    overflow-y: auto;
  }
`;

const CloseButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  z-index: 1010;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const ImageTitle = styled.h2`
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  font-weight: 400;
  color: #333;
`;

const ImageDescription = styled.p`
  margin: 0 0 20px 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
`;

const ImageCategory = styled.span`
  display: inline-block;
  padding: 6px 12px;
  background-color: #96885f;
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 500;
`;

const NavigationButton = styled.button`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  z-index: 1010;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  &.prev {
    left: 20px;
  }
  
  &.next {
    right: 20px;
  }
`;

interface ArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArtwork: Artwork | null;
  artworks: Artwork[];
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const ArtworkModal: FC<ArtworkModalProps> = ({
  isOpen,
  onClose,
  currentArtwork,
  artworks,
  currentIndex,
  onNavigate
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) || 
           url.includes('video/') || 
           url.includes('blob:') && url.includes('video');
  };
  
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow for animation
      setTimeout(() => setIsVisible(true), 10);
      
      // Add event listener for escape key
      const handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') onNavigate('prev');
        if (e.key === 'ArrowRight') onNavigate('next');
      };
      
      window.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
      
      return () => {
        window.removeEventListener('keydown', handleEscKey);
        document.body.style.overflow = '';
      };
    } else {
      setIsVisible(false);
    }
  }, [isOpen, onClose, onNavigate]);
  
  if (!isOpen || !currentArtwork) return null;
  
  return (
    <ModalOverlay 
      className={isVisible ? 'visible' : ''} 
      onClick={onClose}
    >
      <CloseButton onClick={onClose}>×</CloseButton>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ImageContainer>
          {isVideo(currentArtwork.image ?? '') ? (
            <ModalVideo 
              src={currentArtwork.image ?? ''} 
              controls 
              autoPlay 
              muted
            >
              Your browser does not support the video tag.
            </ModalVideo>
          ) : (
            <ModalImage src={convertDefaultToResized(currentArtwork.image ?? '')} alt={currentArtwork.title} />
          )}
        </ImageContainer>
        
        <InfoPanel>
          <ImageTitle>{currentArtwork.title}</ImageTitle>
          <ImageDescription>{currentArtwork.description}</ImageDescription>
          {currentArtwork.data?.category && (
            <ImageCategory>{currentArtwork.data.category}</ImageCategory>
          )}
        </InfoPanel>
      </ModalContent>
      
      {currentIndex > 0 && (
        <NavigationButton 
          className="prev" 
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('prev');
          }}
        >
          ‹
        </NavigationButton>
      )}
      
      {currentIndex < artworks.length - 1 && (
        <NavigationButton 
          className="next" 
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('next');
          }}
        >
          ›
        </NavigationButton>
      )}
    </ModalOverlay>
  );
};

export default ArtworkModal;


