'use client';

import styled from 'styled-components';
import { Modal } from './Modal';
import { ArtworkForm } from './ArtworkForm';
import { Artwork } from '@/utils/interfaces';

interface ArtworkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (artwork: Artwork) => void;
  title?: string;
  artwork?: Artwork | null;
}

export function ArtworkFormModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Create New Artwork',
  artwork,
}: ArtworkFormModalProps) {
  const handleSuccess = (artwork: Artwork) => {
    if (onSuccess) {
      onSuccess(artwork);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="600px"
    >
      <ModalContentWrapper>
        <ArtworkForm onSuccess={handleSuccess} artwork={artwork} />
      </ModalContentWrapper>
    </Modal>
  );
}

const ModalContentWrapper = styled.div`
  padding: 1rem;
`;

