'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import styled from 'styled-components';
import { MediaSelector } from './MediaSelector';
import { getArtist } from '@/utils/api';
import { Artist } from '@/utils/interfaces';
import { ArtistSearch } from './ArtistSearch';
import Image from 'next/image';

export interface Tattoo {
  id?: number;
  slug?: string;
  title: string;
  description: string;
  artist_id?: number;
  artist?: Artist;
  image?: string;
  category?: string;
  placement?: string;
  size?: string;
  style?: string;
  meta?: Record<string, unknown>;
  data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface TattooFormProps {
  onSuccess?: (tattoo: Tattoo) => void;
  tattoo?: Tattoo | null;
  hideSubmitButton?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export interface TattooFormRef {
  submitForm: () => void;
}

const CATEGORIES = [
  'Traditional',
  'Japanese',
  'Geometric',
  'Floral',
  'Blackwork',
  'Watercolor',
  'Realism',
  'Neo-traditional',
  'Tribal',
  'Other',
];

const SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];

export const TattooForm = forwardRef<TattooFormRef, TattooFormProps>(
  function TattooForm({ onSuccess, tattoo, hideSubmitButton, onSubmittingChange }, ref) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(tattoo?.title || '');
  const [description, setDescription] = useState(tattoo?.description || '');
  const [artist, setArtist] = useState<Artist | null>(tattoo?.artist || null);
  const [defaultArtist, setDefaultArtist] = useState<Artist | null>(null);
  const [imageUrl, setImageUrl] = useState(tattoo?.image || '');
  const [category, setCategory] = useState(tattoo?.category || '');
  const [placement, setPlacement] = useState(tattoo?.placement || '');
  const [size, setSize] = useState(tattoo?.size || '');
  const [style, setStyle] = useState(tattoo?.style || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(!!tattoo?.id); // Show form immediately when editing
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (tattoo) {
      setTitle(tattoo.title);
      setDescription(tattoo.description || '');
      setArtist(tattoo.artist || null);
      setImageUrl(tattoo.image || '');
      setCategory(tattoo.category || '');
      setPlacement(tattoo.placement || '');
      setSize(tattoo.size || '');
      setStyle(tattoo.style || '');
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
  }, [tattoo]);

  const handleMediaSelect = async (url: string) => {
    setImageUrl(url);
    setStatus(null);
    
    // Only auto-analyze for new tattoos (not when editing)
    if (!tattoo?.id) {
      await analyzeTattoo(url);
    }
  };

  const analyzeTattoo = async (url: string) => {
    setIsAnalyzing(true);
    setStatus({
      message: 'Analyzing tattoo image...',
      isError: false,
    });

    try {
      const response = await fetch('/api/tattoos/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze tattoo image');
      }

      const analysis = await response.json();

      // Auto-fill form fields with analysis results
      setTitle(analysis.title || '');
      setDescription(analysis.description || '');
      setCategory(analysis.category || '');
      setPlacement(analysis.placement || '');
      setSize(analysis.size || '');
      setStyle(analysis.style || '');

      setStatus({
        message: 'Image analyzed! Fields have been auto-filled. You can edit them as needed.',
        isError: false,
      });
      
      // Show the form after successful analysis
      setShowForm(true);
    } catch (error) {
      console.error('Error analyzing tattoo:', error);
      setStatus({
        message: 'Failed to analyze image. Please fill in the fields manually.',
        isError: true,
      });
      
      // Show the form even if analysis fails so user can fill manually
      setShowForm(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Expose submitForm method via ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (formRef.current) {
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      setStatus({
        message: 'Please upload an image for your tattoo',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setStatus(null);

    try {
      const tattooData: Tattoo = {
        title: title || 'Untitled Tattoo',
        description: description || 'No description provided',
        artist_id: artist?.id,
        image: imageUrl,
        category: category || undefined,
        placement: placement || undefined,
        size: size || undefined,
        style: style || undefined,
        meta: {
          ...tattoo?.meta,
          image: imageUrl,
        },
      };

      console.log('Submitting tattoo data:', tattooData);

      const apiEndpoint = tattoo?.id ? `/api/tattoos/${tattoo.id}` : '/api/tattoos';
      const method = tattoo?.id ? 'PUT' : 'POST';
      
      console.log('API endpoint:', apiEndpoint, 'Method:', method);

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tattooData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to ${tattoo?.id ? 'update' : 'create'} tattoo`;
        console.error('API Error:', errorData);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Tattoo creation successful:', result);

      setStatus({
        message: `Tattoo successfully ${tattoo?.id ? 'updated' : 'created'}!`,
        isError: false,
      });

      // Reset form only if creating new tattoo
      if (!tattoo?.id) {
        setTitle('');
        setDescription('');
        setArtist(defaultArtist);
        setImageUrl('');
        setCategory('');
        setPlacement('');
        setSize('');
        setStyle('');
      }

      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error submitting tattoo:', error);
      setStatus({
        message:
          error instanceof Error ? error.message : `Failed to ${tattoo?.id ? 'update' : 'create'} tattoo`,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <FormWrapper>
      {/* Step 1: Show media selector if no image selected and not analyzing */}
      {!imageUrl && !isAnalyzing && (
        <MediaSelectorSection>
          <SectionTitle>Select or Upload Tattoo Image</SectionTitle>
          <SectionSubtitle>Choose an existing image or upload a new one to get started</SectionSubtitle>
          <MediaSelector
            selectedMediaUrl={imageUrl}
            onSelect={handleMediaSelect}
            accept="image/*"
          />
        </MediaSelectorSection>
      )}

      {/* Step 2: Show large centered analyzing animation */}
      {isAnalyzing && (
        <AnalyzingContainer>
          <AnalyzingSpinnerLarge />
          <AnalyzingTitle>Analyzing Tattoo Image</AnalyzingTitle>
          <AnalyzingSubtitle>Our AI is examining the style, placement, and details...</AnalyzingSubtitle>
        </AnalyzingContainer>
      )}

      {/* Step 3: Show form with image preview after analysis */}
      {showForm && imageUrl && !isAnalyzing && (
        <form ref={formRef} onSubmit={handleSubmit}>
          <PreviewSection>
            <PreviewLabel>Tattoo Image</PreviewLabel>
            <ImagePreview>
              <Image
                src={imageUrl}
                alt="Tattoo preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </ImagePreview>
          </PreviewSection>

        <FormGroup>
          <Label htmlFor="title">Tattoo Title</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter tattoo title"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the tattoo..."
          />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="size">Size</Label>
            <Select
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">Select a size</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label htmlFor="placement">Placement</Label>
            <Input
              id="placement"
              type="text"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              placeholder="e.g., Arm, Leg, Back, Chest"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="style">Style</Label>
            <Input
              id="style"
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g., Bold lines, Shading technique"
            />
          </FormGroup>
        </FormRow>

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
            <SubmitButton type="submit" disabled={isSubmitting || isAnalyzing}>
              {isSubmitting ? (tattoo?.id ? 'Updating...' : 'Creating...') : (tattoo?.id ? 'Update Tattoo' : 'Create Tattoo')}
            </SubmitButton>
          )}
        </form>
      )}
    </FormWrapper>
  );
});

// Set display name for better debugging
TattooForm.displayName = 'TattooForm';

const FormWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  flex: 1;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
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

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;

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

const MediaSelectorSection = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const AnalyzingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  min-height: 400px;
  
  @media (max-width: 768px) {
    padding: 4rem 1rem;
    min-height: 300px;
  }
`;

const AnalyzingSpinnerLarge = styled.div`
  border: 4px solid #ffcc80;
  border-top: 4px solid #e65100;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: spin 1s linear infinite;
  margin-bottom: 2rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    border-width: 3px;
  }
`;

const AnalyzingTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const AnalyzingSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  text-align: center;
  max-width: 500px;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

