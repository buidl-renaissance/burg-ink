'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { UploadButton } from './UploadButton';  
import { createArtwork, updateArtwork, getArtist } from '@/utils/api';
import { Artwork, Artist } from '@/utils/interfaces';
import { ArtistSearch } from './ArtistSearch';
import Image from 'next/image';

interface ArtworkFormProps {
  onSuccess?: (artwork: Artwork) => void;
  artwork?: Artwork | null;
}

export function ArtworkForm({ onSuccess, artwork }: ArtworkFormProps) {
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

  const handleUploadComplete = (url: string) => {
    setImageUrl(url);
    setStatus(null);
  };

  const handleUploadError = (error: string) => {
    setStatus({
      message: `Failed to upload image: ${error}`,
      isError: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      setStatus({
        message: 'Please upload an image for your artwork',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
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
    }
  };

  return (
    <FormContainer>
      <FormTitle>{artwork?.id ? 'Edit Artwork' : 'Create New Artwork'}</FormTitle>

      <form onSubmit={handleSubmit}>
        <UploadContainer>
          <UploadText>Upload your artwork image</UploadText>

          <UploadButton
            accept="image/*"
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          >
            {imageUrl ? 'Change Image' : 'Select Image'}
          </UploadButton>

          {imageUrl && (
            <ImagePreview>
              <Image
                src={imageUrl}
                alt="Artwork preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </ImagePreview>
          )}
        </UploadContainer>

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

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? (artwork?.id ? 'Updating...' : 'Creating...') : (artwork?.id ? 'Update Artwork' : 'Create Artwork')}
        </SubmitButton>
      </form>
    </FormContainer>
  );
}

const FormContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
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

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

const UploadText = styled.p`
  margin-bottom: 1rem;
  color: #666;
  text-align: center;
`;

const ImagePreview = styled.div`
  margin: 1rem 0;
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
  background-color: ${(props) => (props.isError ? '#ffebee' : '#e8f5e9')};
  color: ${(props) => (props.isError ? '#c62828' : '#2e7d32')};
`;
