'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { AdminLayout } from '@/components/AdminLayout';
import { ArtworkForm } from '@/components/ArtworkForm';
import { Artwork } from '@/utils/interfaces';
import { FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';

export default function EditArtworkPage() {
  const router = useRouter();
  const { id } = router.query;
  const formRef = useRef<{ submitForm: () => void }>(null);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArtwork();
    }
  }, [id]);

  const fetchArtwork = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artwork/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artwork');
      }
      const data = await response.json();
      setArtwork(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artwork');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedArtwork: Artwork) => {
    // Redirect back to artwork list after successful update
    router.push('/admin/artwork');
  };

  const handleCancel = () => {
    router.push('/admin/artwork');
  };

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.submitForm();
    }
  };

  const statusBarContent = (
    <StatusBarInner>
      <CancelButton onClick={handleCancel}>
        <FaTimes /> Cancel
      </CancelButton>
      <SubmitButton onClick={handleSubmit} disabled={isSubmitting}>
        <FaCheck /> {isSubmitting ? 'Updating...' : 'Update Artwork'}
      </SubmitButton>
    </StatusBarInner>
  );

  if (loading) {
    return (
      <AdminLayout currentPage="artwork" statusBar={statusBarContent}>
        <Container>
          <LoadingContainer>
            <FaSpinner className="spinner" />
            <p>Loading artwork...</p>
          </LoadingContainer>
        </Container>
      </AdminLayout>
    );
  }

  if (error || !artwork) {
    return (
      <AdminLayout currentPage="artwork" statusBar={statusBarContent}>
        <Container>
          <ErrorContainer>
            <h2>Error</h2>
            <p>{error || 'Artwork not found'}</p>
            <BackButton onClick={handleCancel}>
              Back to Artwork List
            </BackButton>
          </ErrorContainer>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      currentPage="artwork"
      statusBar={statusBarContent}
    >
      <Container>
        <FormContainer>
          <ArtworkForm 
            ref={formRef}
            onSuccess={handleSuccess}
            onSubmittingChange={setIsSubmitting}
            artwork={artwork}
            hideSubmitButton
          />
        </FormContainer>
      </Container>
    </AdminLayout>
  );
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6c757d;

  .spinner {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  p {
    font-size: 1.1rem;
  }
`;

const ErrorContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;

  h2 {
    color: #dc3545;
    margin-bottom: 1rem;
  }

  p {
    color: #6c757d;
    margin-bottom: 2rem;
  }
`;

const BackButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #7a6f4d;
  }
`;

const StatusBarInner = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #e9ecef;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    gap: 1rem;
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #5a6268;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #218838;
  }

  &:disabled {
    background: #94d3a2;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;

