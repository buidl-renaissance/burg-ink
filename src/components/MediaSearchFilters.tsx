'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

// Styled Components
const SearchContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const SearchIcon = styled.div`
  color: #96885f;
  font-size: 1.2rem;
`;

const SearchTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 150px;

  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
`;

const FilterLabel = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
  }
`;

const DateRangeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DateInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
  }
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const TagChip = styled.div<{ selected: boolean }>`
  background: ${props => props.selected ? '#96885f' : '#f8f9fa'};
  color: ${props => props.selected ? 'white' : '#333'};
  border: 1px solid ${props => props.selected ? '#96885f' : '#e9ecef'};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.selected ? '#7a6f4d' : '#e9ecef'};
  }
`;

const TagInput = styled.input`
  padding: 0.25rem 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 0.85rem;
  min-width: 100px;
  
  &:focus {
    outline: none;
    border-color: #96885f;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#96885f' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#6c757d'};
  border: 1px solid ${props => props.variant === 'primary' ? '#96885f' : '#e9ecef'};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#7a6f4d' : '#f8f9fa'};
  }
`;

const ClearButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    background: #c82333;
  }
`;

// Types
export interface SearchFilters {
  query: string;
  source: string;
  status: string;
  mimeType: string;
  dateFrom: string;
  dateTo: string;
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface MediaSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
  onSearch: () => void;
  onClear: () => void;
}

export const MediaSearchFilters: React.FC<MediaSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTags,
  onSearch,
  onClear
}) => {
  const [newTag, setNewTag] = useState('');

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleTagAdd = () => {
    if (newTag.trim() && !filters.tags.includes(newTag.trim())) {
      handleFilterChange('tags', [...filters.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleFilterChange('tags', filters.tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagToggle = (tag: string) => {
    if (filters.tags.includes(tag)) {
      handleTagRemove(tag);
    } else {
      handleFilterChange('tags', [...filters.tags, tag]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.target === document.querySelector('input[placeholder="Search..."]')) {
        onSearch();
      } else {
        handleTagAdd();
      }
    }
  };

  return (
    <SearchContainer>
      <SearchHeader>
        <SearchIcon>
          <FaSearch />
        </SearchIcon>
        <SearchTitle>Search & Filter Media</SearchTitle>
      </SearchHeader>

      <SearchRow>
        <SearchInput
          type="text"
          placeholder="Search by filename, description, or tags..."
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          onKeyPress={handleKeyPress}
        />
        
        <FilterGroup>
          <FilterLabel>Source:</FilterLabel>
          <FilterSelect
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="upload">Upload</option>
            <option value="google_drive">Google Drive</option>
            <option value="url">URL</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Status:</FilterLabel>
          <FilterSelect
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Type:</FilterLabel>
          <FilterSelect
            value={filters.mimeType}
            onChange={(e) => handleFilterChange('mimeType', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </FilterSelect>
        </FilterGroup>
      </SearchRow>

      <SearchRow>
        <DateRangeContainer>
          <FilterLabel>From:</FilterLabel>
          <DateInput
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
          <FilterLabel>To:</FilterLabel>
          <DateInput
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </DateRangeContainer>

        <FilterGroup>
          <FilterLabel>Sort:</FilterLabel>
          <FilterSelect
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="filename">Filename</option>
            <option value="size">File Size</option>
            <option value="processing_status">Status</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Order:</FilterLabel>
          <FilterSelect
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </FilterSelect>
        </FilterGroup>
      </SearchRow>

      <div>
        <FilterLabel>Tags:</FilterLabel>
        <TagContainer>
          {filters.tags.map(tag => (
            <TagChip key={tag} selected={true} onClick={() => handleTagRemove(tag)}>
              {tag}
              <FaTimes />
            </TagChip>
          ))}
          
          {availableTags.slice(0, 20).map(tag => (
            <TagChip 
              key={tag} 
              selected={filters.tags.includes(tag)}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </TagChip>
          ))}
          
          <TagInput
            type="text"
            placeholder="Add custom tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </TagContainer>
      </div>

      <ActionButtons>
        <ActionButton variant="primary" onClick={onSearch}>
          <FaSearch />
          Search
        </ActionButton>
        
        <ActionButton onClick={() => window.location.reload()}>
          <FaFilter />
          Reset Filters
        </ActionButton>
        
        <ClearButton onClick={onClear}>
          <FaTimes />
          Clear All
        </ClearButton>
      </ActionButtons>
    </SearchContainer>
  );
};
