'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { FaPlus, FaTimes, FaSearch, FaSpinner } from 'react-icons/fa';

interface LinkedWork {
  id: number;
  slug: string;
  title: string;
  image: string | null;
  type: 'artwork' | 'tattoo';
  category?: string | null;
  relationship_type?: string;
}

interface RelationshipManagerProps {
  entityType: 'artwork' | 'tattoo';
  entityId?: number;
  onRelationshipsChange?: () => void;
}

export function RelationshipManager({
  entityType,
  entityId,
  onRelationshipsChange,
}: RelationshipManagerProps) {
  const [linkedWorks, setLinkedWorks] = useState<LinkedWork[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LinkedWork[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch linked works when component mounts or entityId changes
  useEffect(() => {
    if (entityId) {
      fetchLinkedWorks();
    }
  }, [entityId]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLinkedWorks = async () => {
    if (!entityId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/work-relationships?entityType=${entityType}&entityId=${entityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setLinkedWorks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching linked works:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/work-relationships/search?query=${encodeURIComponent(
          searchQuery
        )}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        // Filter out already linked works and the current entity
        const filtered = (data.data || []).filter(
          (work: LinkedWork) =>
            !(work.type === entityType && work.id === entityId) &&
            !linkedWorks.some(
              (linked) => linked.id === work.id && linked.type === work.type
            )
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching works:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddLink = async (targetWork: LinkedWork) => {
    if (!entityId) return;

    try {
      const response = await fetch('/api/work-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: entityType,
          sourceId: entityId,
          targetType: targetWork.type,
          targetId: targetWork.id,
          relationshipType: 'related',
        }),
      });

      if (response.ok) {
        await fetchLinkedWorks();
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchOpen(false);
        onRelationshipsChange?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create link');
    }
  };

  const handleRemoveLink = async (linkedWork: LinkedWork) => {
    if (!entityId) return;

    if (!confirm(`Remove link to "${linkedWork.title}"?`)) return;

    try {
      const response = await fetch('/api/work-relationships', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: entityType,
          sourceId: entityId,
          targetType: linkedWork.type,
          targetId: linkedWork.id,
        }),
      });

      if (response.ok) {
        await fetchLinkedWorks();
        onRelationshipsChange?.();
      } else {
        alert('Failed to remove link');
      }
    } catch (error) {
      console.error('Error removing link:', error);
      alert('Failed to remove link');
    }
  };

  if (!entityId) {
    return (
      <Container>
        <InfoMessage>
          Save this {entityType} first to manage linked works.
        </InfoMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Linked Works</Title>
        <AddButton onClick={() => setIsSearchOpen(true)}>
          <FaPlus /> Add Link
        </AddButton>
      </Header>

      {isLoading ? (
        <LoadingContainer>
          <FaSpinner className="spinner" />
          <p>Loading linked works...</p>
        </LoadingContainer>
      ) : linkedWorks.length === 0 ? (
        <EmptyState>
          <p>No linked works yet.</p>
          <p>Click "Add Link" to connect this {entityType} to other works.</p>
        </EmptyState>
      ) : (
        <WorksGrid>
          {linkedWorks.map((work) => (
            <WorkCard key={`${work.type}-${work.id}`}>
              <ImageContainer>
                {work.image ? (
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    sizes="150px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <PlaceholderImage>No Image</PlaceholderImage>
                )}
                <TypeBadge>{work.type}</TypeBadge>
              </ImageContainer>
              <WorkInfo>
                <WorkTitle>{work.title}</WorkTitle>
                {work.category && <WorkCategory>{work.category}</WorkCategory>}
              </WorkInfo>
              <RemoveButton
                onClick={() => handleRemoveLink(work)}
                title="Remove link"
              >
                <FaTimes />
              </RemoveButton>
            </WorkCard>
          ))}
        </WorksGrid>
      )}

      {isSearchOpen && (
        <SearchOverlay onClick={() => setIsSearchOpen(false)}>
          <SearchModal onClick={(e) => e.stopPropagation()}>
            <SearchHeader>
              <SearchTitle>Search Works to Link</SearchTitle>
              <CloseButton onClick={() => setIsSearchOpen(false)}>
                <FaTimes />
              </CloseButton>
            </SearchHeader>

            <SearchInputContainer>
              <FaSearch />
              <SearchInput
                type="text"
                placeholder="Search artwork and tattoos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </SearchInputContainer>

            <SearchResults>
              {isSearching ? (
                <LoadingContainer>
                  <FaSpinner className="spinner" />
                </LoadingContainer>
              ) : searchQuery && searchResults.length === 0 ? (
                <EmptySearchState>No matching works found.</EmptySearchState>
              ) : (
                searchResults.map((work) => (
                  <SearchResultItem
                    key={`${work.type}-${work.id}`}
                    onClick={() => handleAddLink(work)}
                  >
                    <ResultImage>
                      {work.image ? (
                        <Image
                          src={work.image}
                          alt={work.title}
                          fill
                          sizes="60px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <PlaceholderImage>No Image</PlaceholderImage>
                      )}
                    </ResultImage>
                    <ResultInfo>
                      <ResultTitle>{work.title}</ResultTitle>
                      <ResultMeta>
                        <TypeBadge>{work.type}</TypeBadge>
                        {work.category && <span>{work.category}</span>}
                      </ResultMeta>
                    </ResultInfo>
                  </SearchResultItem>
                ))
              )}
            </SearchResults>
          </SearchModal>
        </SearchOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background: #96885f;
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
    background: #7a6f4d;
  }

  svg {
    font-size: 0.875rem;
  }
`;

const InfoMessage = styled.p`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  color: #6c757d;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6c757d;

  .spinner {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;

  p:first-child {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  p:last-child {
    font-size: 0.9rem;
  }
`;

const WorksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const WorkCard = styled.div`
  position: relative;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #f8f9fa;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 0.875rem;
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
`;

const WorkInfo = styled.div`
  padding: 0.75rem;
`;

const WorkTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const WorkCategory = styled.p`
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 28px;
  height: 28px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  opacity: 0;

  ${WorkCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(200, 35, 51, 1);
  }

  svg {
    font-size: 0.75rem;
  }
`;

const SearchOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const SearchModal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const SearchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
`;

const SearchTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
    color: #333;
  }
`;

const SearchInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  color: #6c757d;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #333;

  &::placeholder {
    color: #adb5bd;
  }
`;

const SearchResults = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const EmptySearchState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
`;

const SearchResultItem = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }
`;

const ResultImage = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6c757d;

  ${TypeBadge} {
    position: static;
    font-size: 0.7rem;
    padding: 0.125rem 0.375rem;
  }
`;

