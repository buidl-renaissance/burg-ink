'use client';

import { useState, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { AdminLayout } from '@/components/AdminLayout';
import { TattooForm, TattooFormRef } from '@/components/TattooForm';
import { FaTimes, FaCheck } from 'react-icons/fa';

export default function CreateTattooPage() {
  const router = useRouter();
  const formRef = useRef<TattooFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = () => {
    // Redirect back to tattoos list after successful creation
    router.push('/admin/tattoos');
  };

  const handleCancel = () => {
    router.push('/admin/tattoos');
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
        <FaCheck /> {isSubmitting ? 'Creating...' : 'Create Tattoo'}
      </SubmitButton>
    </StatusBarInner>
  );

  return (
    <AdminLayout 
      currentPage="tattoos"
      statusBar={statusBarContent}
    >
      <Container>
        <FormContainer>
          <TattooForm 
            ref={formRef}
            onSuccess={handleSuccess}
            onSubmittingChange={setIsSubmitting}
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

