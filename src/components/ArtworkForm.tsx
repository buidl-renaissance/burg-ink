'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import styled from 'styled-components';
import { MediaSelector } from './MediaSelector';
import { createArtwork, updateArtwork, getArtist } from '@/utils/api';
import { Artwork, Artist } from '@/utils/interfaces';
import { ArtistSearch } from './ArtistSearch';
import { RelationshipManager } from './RelationshipManager';
import Image from 'next/image';

interface ArtworkFormProps {
  onSuccess?: (artwork: Artwork) => void;
  artwork?: Artwork | null;
  hideSubmitButton?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export interface ArtworkFormRef {
  submitForm: () => void;
}

export const ArtworkForm = forwardRef<ArtworkFormRef, ArtworkFormProps>(
  function ArtworkForm({ onSuccess, artwork, hideSubmitButton, onSubmittingChange }, ref) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(artwork?.title || '');
  const [description, setDescription] = useState(artwork?.description || '');
  const [artist, setArtist] = useState<Artist | null>(artwork?.artist || null);
  const [defaultArtist, setDefaultArtist] = useState<Artist | null>(null);
  const [imageUrl, setImageUrl] = useState(artwork?.image || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title);
      setDescription(artwork.description);
      setArtist(artwork.artist || null);
      setImageUrl(artwork.image || '');
    } else if (process.env.NEXT_PUBLIC_DPOP_ARTIST_ID) {
      const fetchArtist = async () => {
        try {
          const artist = await getArtist(process.env.NEXT_PUBLIC_DPOP_ARTIST_ID as string);
          setArtist(artist);
          setDefaultArtist(artist);
        } catch (error) {
          console.error('Failed to fetch default artist:', error);
        }
      };
      fetchArtist();
    }
  }, [artwork]);

  const handleMediaSelect = (url: string) => {
    setImageUrl(url);
    setStatus(null);
  };

  // Expose submitForm method via ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (formRef.current) {
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }));

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) || 
           url.includes('video/') || 
           url.includes('blob:') && url.includes('video');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      setStatus({
        message: 'Please upload an image or video for your artwork',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setStatus(null);

    try {
      const artworkData = {
        title: title || 'Untitled Artwork',
        description: description || 'No description provided',
        artist_id: artist?.id,
        image: imageUrl,
        type: 'artwork',
        category: 'general',
        meta: {
          ...artwork?.meta,
          image: imageUrl,
        },
      };

      let result;
      if (artwork?.id) {
        result = await updateArtwork({ ...artworkData, id: artwork.id });
      } else {
        result = await createArtwork(artworkData);
      }

      setStatus({
        message: `Artwork successfully ${artwork?.id ? 'updated' : 'created'}!`,
        isError: false,
      });

      // Reset form only if creating new artwork
      if (!artwork?.id) {
        setTitle('');
        setDescription('');
        setArtist(defaultArtist);
        setImageUrl('');
      }

      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : `Failed to ${artwork?.id ? 'update' : 'create'} artwork`,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <FormWrapper>
      <form ref={formRef} onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Select or Upload Media</Label>
          <MediaSelector
            selectedMediaUrl={imageUrl}
            onSelect={handleMediaSelect}
            accept="image/*,video/*"
          />
        </FormGroup>

        {imageUrl && (
          <PreviewSection>
            <PreviewLabel>Selected Media Preview</PreviewLabel>
            <ImagePreview>
              {isVideo(imageUrl) ? (
                <video
                  src={imageUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  src={imageUrl}
                  alt="Artwork preview"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              )}
            </ImagePreview>
          </PreviewSection>
        )}

        <FormGroup>
          <Label htmlFor="title">Artwork Title</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter artwork title"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your artwork..."
          />
        </FormGroup>

        {/* <FormGroup>
          <Label htmlFor="artistName">Artist Name</Label>
          <Input
            id="artistName"
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Your name or pseudonym"
          />
        </FormGroup> */}

        {!defaultArtist && (
          <FormGroup>
            <Label htmlFor="artist">Artist</Label>
            <ArtistSearch onSelect={setArtist} />
          </FormGroup>
        )}

        {status && (
          <StatusMessage isError={status.isError}>
            {status.message}
          </StatusMessage>
        )}

        {!hideSubmitButton && (
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? (artwork?.id ? 'Updating...' : 'Creating...') : (artwork?.id ? 'Update Artwork' : 'Create Artwork')}
          </SubmitButton>
        )}
      </form>

      <RelationshipManager
        entityType="artwork"
        entityId={artwork?.id}
      />
    </FormWrapper>
  );
});

// Set display name for better debugging
ArtworkForm.displayName = 'ArtworkForm';

const FormWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3d9140;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const PreviewSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PreviewLabel = styled.div`
  font-weight: 500;
  color: #444;
  margin-bottom: 0.5rem;
`;

const ImagePreview = styled.div`
  margin: 0;
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
  background-color: ${(props) => (props.isError ? '#ffebee' : '#e8f5e9')};
  color: ${(props) => (props.isError ? '#c62828' : '#2e7d32')};
`;
