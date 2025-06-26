'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaChevronDown } from 'react-icons/fa';
import { updateArtworkStatus } from '@/utils/api';
import { Artwork } from '@/utils/interfaces';

interface StatusDropdownProps {
  artwork: Artwork;
//   onStatusUpdate: (artworkId: number, newStatus: string) => void;
  onError: (error: string) => void;
}

const StatusDropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const StatusBadge = styled.span<{ status: string; clickable?: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => 
    props.status === 'published' ? '#d4edda' : 
    props.status === 'draft' ? '#fff3cd' : '#f8d7da'
  };
  color: ${props => 
    props.status === 'published' ? '#155724' : 
    props.status === 'draft' ? '#856404' : '#721c24'
  };
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${props => props.clickable ? 0.8 : 1};
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: ${props => props.isOpen ? 'block' : 'none'};
  min-width: 120px;
`;

const DropdownItem = styled.div`
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

export function StatusDropdown({ 
  artwork, 
  onError 
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      console.log('Updating status for artwork:', artwork.id, 'to:', newStatus);
      const updatedArtwork = await updateArtworkStatus(artwork.id, newStatus);
      artwork.meta.status = newStatus;
      console.log('Updated artwork response:', updatedArtwork);
    //   onStatusUpdate(artworkId, newStatus);
      setIsOpen(false);
    } catch (err) {
      console.error('Status update error:', err);
      onError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <StatusDropdownContainer ref={dropdownRef}>
      <StatusBadge 
        status={artwork.meta.status as string}
        clickable={true}
        onClick={toggleDropdown}
      >
        {artwork.meta.status as string}
        <FaChevronDown />
      </StatusBadge>
      <DropdownMenu isOpen={isOpen}>
        <DropdownItem onClick={() => handleStatusUpdate('published')}>
          Published
        </DropdownItem>
        <DropdownItem onClick={() => handleStatusUpdate('draft')}>
          Draft
        </DropdownItem>
      </DropdownMenu>
    </StatusDropdownContainer>
  );
} 