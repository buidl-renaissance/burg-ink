'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { UploadMedia } from '@/components/UploadMedia';
import { MediaProcessingIndicator } from '@/components/MediaProcessingIndicator';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { FaEye, FaTrash, FaDownload, FaSpinner, FaTh, FaList, FaTimes, FaPlus, FaFilter } from 'react-icons/fa';
import { GetServerSideProps } from 'next';

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  padding-bottom: 5rem;
  min-height: calc(100vh - 200px);
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6c757d;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const UploadSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px dashed #e9ecef;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: #96885f;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const UploadHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
`;

const UploadIcon = styled.div`
  background: #96885f;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 1rem;
  }
`;

const UploadText = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  p {
    margin: 0;
    color: #6c757d;
    font-size: 0.9rem;

    @media (max-width: 768px) {
      font-size: 0.85rem;
    }
  }
`;

const UploadSuccess = styled.div`
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 1rem 0;
  }
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 1000px;

  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #f9fafb;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 0.75rem center;
  background-size: 1.25rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (max-width: 768px) {
    width: 100%;
    min-width: auto;
    max-width: none;
  }
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const FilterButton = styled.button<{ $hasActiveFilters?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$hasActiveFilters ? '#96885f' : '#d1d5db'};
  border-radius: 6px;
  font-size: 0.95rem;
  background: ${props => props.$hasActiveFilters ? '#f9f7f4' : '#f9fafb'};
  color: ${props => props.$hasActiveFilters ? '#96885f' : '#333'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;

  &:hover {
    border-color: #96885f;
    background: #f9f7f4;
  }

  &:focus {
    outline: none;
    border-color: #96885f;
  }

  svg {
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    padding: 0.65rem 0.85rem;
    font-size: 0.9rem;
  }
`;

const FilterBadge = styled.span<{ $isHovered?: boolean }>`
  background: ${props => props.$isHovered ? '#d32f2f' : '#96885f'};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  min-width: 1.25rem;
  text-align: center;
  transition: all 0.2s ease;
  cursor: ${props => props.$isHovered ? 'pointer' : 'default'};
  
  &:hover {
    background: #b71c1c;
  }
`;

const FilterDropdownPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1.25rem;
  min-width: 280px;
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};

  @media (max-width: 768px) {
    left: auto;
    right: 0;
    min-width: 260px;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 0.65rem 2rem 0.65rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #f9fafb;
  color: #333;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.1rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: #96885f;
  }

  &:focus {
    outline: none;
    border-color: #96885f;
    background: white;
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const FilterActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: ${props => props.$variant === 'primary' ? 'none' : '1px solid #d1d5db'};
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  background: ${props => props.$variant === 'primary' ? '#96885f' : 'white'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#7d7250' : '#f3f4f6'};
  }
`;

const FilterContainer = styled.div`
  position: relative;
`;

const UploadButton = styled.button`
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #333;
  }

  @media (max-width: 768px) {
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
  }
`;

const ViewToggleGroup = styled.div`
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: white;
`;

const ViewToggleButton = styled.button<{ active?: boolean }>`
  padding: 0.75rem 1rem;
  border: none;
  border-right: 1px solid #d1d5db;
  background: ${props => props.active ? '#1a1a1a' : 'white'};
  color: ${props => props.active ? 'white' : '#6c757d'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  min-width: 44px;

  &:last-child {
    border-right: none;
  }

  &:hover {
    background: ${props => props.active ? '#1a1a1a' : '#f3f4f6'};
  }

  svg {
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    padding: 0.65rem 0.85rem;
    font-size: 0.9rem;
    min-width: 40px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6c757d;
  
  .spinner {
    animation: spin 1s linear infinite;
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6c757d;
`;

const RetryButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #7a6f4d;
  }
`;

const BottomBarInner = styled.div<{ hasActions?: boolean }>`
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: ${props => props.hasActions ? 'space-between' : 'flex-start'};
  gap: 2rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
  transition: all 0.3s ease;

  ${props => props.hasActions && `
    animation: highlightBar 0.5s ease;
    background: linear-gradient(to right, #f0f9ff 0%, white 100%);
  `}

  @keyframes highlightBar {
    0% {
      background: white;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }
    50% {
      background: linear-gradient(to right, #dbeafe 0%, #f0f9ff 100%);
      box-shadow: 0 -4px 20px rgba(59, 130, 246, 0.2);
    }
    100% {
      background: linear-gradient(to right, #f0f9ff 0%, white 100%);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    gap: 1rem;
    font-size: 0.9rem;
    flex-direction: ${props => props.hasActions ? 'row' : 'column'};
  }
`;

const BottomBarText = styled.div`
  color: #6c757d;
  
  strong {
    color: #333;
    font-weight: 600;
  }
`;

const BottomBarActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-left: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const BottomBarButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#96885f'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.danger ? '#c82333' : '#7a6f4d'};
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MediaCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`;

const MediaThumbnail = styled.div`
  position: relative;
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceholderThumbnail = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 600;
  font-size: 1.2rem;
`;

const MediaInfo = styled.div`
  padding: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.75rem 0;
  word-break: break-word;
`;

const MediaDetails = styled.div`
  margin-bottom: 0.75rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
`;

const DetailLabel = styled.span`
  color: #6c757d;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #333;
`;

const MediaDescription = styled.p`
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const MediaActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#f8f9fa'};
  color: ${props => props.danger ? 'white' : '#333'};
  border: 1px solid ${props => props.danger ? '#dc3545' : '#e9ecef'};
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.danger ? '#c82333' : '#e9ecef'};
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #7a6f4d;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #6c757d;
  font-weight: 500;
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TileItem = styled.div<{ selected?: boolean }>`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: ${props => props.selected 
    ? '0 8px 32px rgba(59, 130, 246, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.2)' 
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  aspect-ratio: 1;
  border: 3px solid ${props => props.selected ? '#3b82f6' : 'transparent'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.selected 
      ? '0 12px 40px rgba(59, 130, 246, 0.7), 0 0 0 1px rgba(59, 130, 246, 0.3)' 
      : '0 4px 12px rgba(0, 0, 0, 0.15)'};
  }
`;

const TileImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TileCheckbox = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #3b82f6;
    border-radius: 4px;
  }
`;

const PlaceholderImage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 600;
  font-size: 1.2rem;
`;

// List View Styles
const MediaTable = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 30px 60px 1fr 120px 140px;
  gap: 1rem;
  padding: 1rem 1.5rem 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    grid-template-columns: 35px 50px 1fr 100px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
`;

const TableHeaderCell = styled.div<{ align?: string }>`
  text-align: ${props => props.align || 'left'};
  display: flex;
  align-items: center;
  min-width: 0;
  
  @media (max-width: 768px) {
    &.hide-mobile {
      display: none;
    }
  }
`;

const TableRow = styled.div<{ selected?: boolean }>`
  display: grid;
  grid-template-columns: 30px 60px 1fr 120px 140px;
  gap: 1rem;
  padding: 1rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background: ${props => props.selected ? 'rgba(59, 130, 246, 0.08)' : 'white'};

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 35px 50px 1fr 100px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
`;

const TableCell = styled.div<{ align?: string }>`
  display: flex;
  align-items: center;
  text-align: ${props => props.align || 'left'};
  color: #333;
  font-size: 0.9rem;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    &.hide-mobile {
      display: none;
    }
  }
`;

const TableCheckbox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3b82f6;
    border-radius: 4px;
  }
`;

const ListThumbnail = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSubtext = styled.div`
  color: #6c757d;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;


const SidebarHeader = styled.div`
  background: #96885f;
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 68px;
  right: 0;
  width: 400px;
  z-index: 20;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    top: 0;
    width: 100%;
  }
`;

const SidebarTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`;

const SidebarContent = styled.div`
  flex: 1;
  padding: 0;
  padding-top: 68px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding-top: 60px;
  }
`;

const SidebarImage = styled.div`
  position: relative;
  background: #f8f9fa;
  width: 100%;
  padding: 1.5rem 1.5rem 0;
  
  @media (max-width: 768px) {
    padding: 1rem 1rem 0;
  }
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const SidebarDetailsWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1rem 1.5rem 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem 1rem;
  }
`;

const MediaTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
  word-break: break-word;
`;
  
const SidebarSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem 0;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const DescriptionText = styled.p`
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const SidebarTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SidebarTag = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
`;

const SidebarActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const SidebarActionButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#96885f'};
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  font-weight: 500;
  min-width: fit-content;
  
  &:hover {
    background: ${props => props.danger ? '#c82333' : '#7a6f4d'};
  }
`;

const StatusValue = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: 500;
`;

const EntityLinkedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  z-index: 10;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// Interfaces and Types
interface MediaItem {
  id: string | number; // Support both for UUID and legacy integer IDs
  source: string;
  source_id?: string;
  filename: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  original_url?: string;
  medium_url?: string;
  spaces_url?: string;
  thumbnail_url?: string;
  processing_status?: string | null;
  title?: string;
  description?: string;
  alt_text?: string;
  tags?: string[];
  ai_analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  // New classification fields
  detected_type?: string | null;
  detection_confidence?: string | null;
  detections?: string | null;
  suggested_entity_id?: number | null;
  suggested_entity_type?: string | null;
  created_at: number; // Unix timestamp in seconds
  updated_at?: number;
  processed_at?: number;
}

interface MediaResponse {
  media: MediaItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

type ViewFormat = 'tile' | 'card' | 'list';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Media'
    }
  }
};

export default function AdminMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewFormat, setViewFormat] = useState<ViewFormat>('tile');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterButtonHovered, setFilterButtonHovered] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sourceFilter, dateFilter, typeFilter, confidenceFilter, debouncedSearchTerm]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };

    if (filterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdownOpen]);

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (sourceFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (confidenceFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    return count;
  };

  // Reset all filters
  const resetFilters = (closeDropdown: boolean = true) => {
    setSourceFilter('all');
    setTypeFilter('all');
    setConfidenceFilter('all');
    setDateFilter('all');
    if (closeDropdown) {
      setFilterDropdownOpen(false);
    }
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * 30;
      
      const params = new URLSearchParams({
        limit: '30',
        offset: offset.toString(),
        source: sourceFilter,
        detected_type: typeFilter,
        confidence_min: confidenceFilter === 'high' ? '0.8' : 
                       confidenceFilter === 'medium' ? '0.6' : 
                       confidenceFilter === 'low' ? '0.3' : '',
        search: debouncedSearchTerm.trim(),
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/media?${params}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data: MediaResponse = await response.json();
      setMedia(data.media);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error fetching media:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedMedia(null);
  };

  const handleUploadComplete = (urls: string[]) => {
    const fileCount = urls.length;
    setUploadSuccess(`${fileCount} file${fileCount > 1 ? 's' : ''} uploaded successfully! Processing...`);
    
    // Immediately refresh to show new items with processing status
    fetchMedia();
    
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  // Debounced refresh function - only refresh once every 1 second
  const fetchMediaRef = useRef(fetchMedia);
  fetchMediaRef.current = fetchMedia;
  
  const debouncedRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedRefreshMedia = useCallback(() => {
    if (debouncedRefreshRef.current) {
      clearTimeout(debouncedRefreshRef.current);
    }
    debouncedRefreshRef.current = setTimeout(() => {
      fetchMediaRef.current();
    }, 1000);
  }, []);


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'processing': return '#ffc107';
      case 'failed': return '#dc3545';
      case 'pending': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status || '';
    }
  };

  const isProcessing = (item: MediaItem) => {
    return item.processing_status === 'pending' || item.processing_status === 'processing';
  };

  // Classification helper functions
  const hasEntityLink = (item: MediaItem) => {
    return item.suggested_entity_id && item.suggested_entity_type;
  };

  const getEntityLinkIcon = (item: MediaItem) => {
    if (!hasEntityLink(item)) return null;
    
    const icon = item.suggested_entity_type === 'tattoo' ? '💉' : '🎨';
    return (
      <EntityLinkedBadge title={`Linked to ${item.suggested_entity_type}`}>
        {icon}
      </EntityLinkedBadge>
    );
  };

  const filterMediaByClassification = (mediaList: MediaItem[]) => {
    let filtered = mediaList;

    // Filter by detected type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.detected_type === typeFilter);
    }

    // Filter by confidence level
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (!item.detection_confidence) return false;
        const confidence = parseFloat(item.detection_confidence);
        
        switch (confidenceFilter) {
          case 'high': return confidence >= 0.8;
          case 'medium': return confidence >= 0.6 && confidence < 0.8;
          case 'low': return confidence >= 0.3 && confidence < 0.6;
          case 'none': return confidence < 0.3 || !item.detected_type;
          default: return true;
        }
      });
    }

    return filtered;
  };

  const handleSelectAll = () => {
    if (selectedItems.size === media.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(media.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string | number) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.add(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit items:', Array.from(selectedItems));
  };

  const handleDeleteSingle = async (mediaId: string | number) => {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this media file? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete media');
      }

      const data = await response.json();
      setUploadSuccess(data.message || 'Media deleted successfully');
      
      // Close sidebar if the deleted item was selected
      if (selectedMedia && selectedMedia.id === mediaId) {
        closeSidebar();
      }
      
      // Refresh media list
      await fetchMedia();
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting media:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete media');
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete ${selectedItems.size} media file${selectedItems.size !== 1 ? 's' : ''}? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          action: 'delete',
          mediaIds: Array.from(selectedItems),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete media');
      }

      const data = await response.json();
      setUploadSuccess(data.message || `Successfully deleted ${selectedItems.size} media file${selectedItems.size !== 1 ? 's' : ''}`);
      
      // Clear selection
      setSelectedItems(new Set());
      
      // Refresh media list
      await fetchMedia();
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting media:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete media');
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Component to handle real-time updates for a single media item
  const MediaItemWithProcessing: React.FC<{ item: MediaItem; children: React.ReactNode }> = ({ item, children }) => {
    const shouldTrack = isProcessing(item);
    const mediaId = String(item.id);
    
    useMediaProcessing({
      mediaId,
      enabled: shouldTrack,
      pollInterval: 2000,
      onComplete: () => {
        // Refresh the media list when processing completes (debounced)
        debouncedRefreshMedia();
      },
      onError: () => {
        // Refresh on error too (debounced)
        debouncedRefreshMedia();
      },
    });

    return <>{children}</>;
  };

  const totalPages = Math.ceil(totalItems / 30);

  // Sidebar content
  const sidebarContent = selectedMedia && (
    <>
      <SidebarHeader>
        <SidebarTitle>Media Details</SidebarTitle>
        <CloseButton onClick={closeSidebar}>
          <FaTimes />
        </CloseButton>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarImage>
          {(selectedMedia.original_url || selectedMedia.medium_url || selectedMedia.thumbnail_url) ? (
            <img 
              src={selectedMedia.original_url || selectedMedia.medium_url || selectedMedia.thumbnail_url} 
              alt={selectedMedia.alt_text || selectedMedia.filename} 
            />
          ) : (
            <PlaceholderImage>
              <span>{selectedMedia.mime_type.split('/')[0].toUpperCase()}</span>
            </PlaceholderImage>
          )}
        </SidebarImage>
        
        <SidebarDetailsWrapper>
          <MediaTitle>{selectedMedia.title || selectedMedia.filename}</MediaTitle>
          
          {selectedMedia.description && (
            <DescriptionText>{selectedMedia.description}</DescriptionText>
          )}

          {selectedMedia.tags && selectedMedia.tags.length > 0 && (
            <SidebarTags>
              {selectedMedia.tags.map((tag, index) => (
                <SidebarTag key={index}>{tag}</SidebarTag>
              ))}
            </SidebarTags>
          )}

          <SidebarActions>
            {selectedMedia.spaces_url && (
              <SidebarActionButton onClick={() => window.open(selectedMedia.spaces_url, '_blank')}>
                <FaEye /> View
              </SidebarActionButton>
            )}
            <SidebarActionButton onClick={() => window.open(selectedMedia.spaces_url, '_blank')}>
              <FaDownload /> Download
            </SidebarActionButton>
            <SidebarActionButton danger onClick={() => handleDeleteSingle(selectedMedia.id)}>
              <FaTrash /> Delete
            </SidebarActionButton>
          </SidebarActions>

          <SidebarSection>
            <SectionTitle>File Information</SectionTitle>
            <DetailRow>
              <DetailLabel>Filename:</DetailLabel>
              <DetailValue>{selectedMedia.filename}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Size:</DetailLabel>
              <DetailValue>{formatFileSize(selectedMedia.size)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Dimensions:</DetailLabel>
              <DetailValue>
                {selectedMedia.width && selectedMedia.height 
                  ? `${selectedMedia.width} × ${selectedMedia.height}` 
                  : 'Processing...'}
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Type:</DetailLabel>
              <DetailValue>{selectedMedia.mime_type}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Source:</DetailLabel>
              <DetailValue>{selectedMedia.source}</DetailValue>
            </DetailRow>
            {selectedMedia.processing_status && selectedMedia.processing_status !== 'completed' && (
              <DetailRow>
                <DetailLabel>Status:</DetailLabel>
                <StatusValue color={getStatusColor(selectedMedia.processing_status)}>
                  {getStatusLabel(selectedMedia.processing_status)}
                </StatusValue>
              </DetailRow>
            )}
            {selectedMedia.detected_type && (
              <DetailRow>
                <DetailLabel>Classification:</DetailLabel>
                <StatusValue color={selectedMedia.detected_type === 'tattoo' ? '#22c55e' : selectedMedia.detected_type === 'artwork' ? '#3b82f6' : '#6b7280'}>
                  {selectedMedia.detected_type.charAt(0).toUpperCase() + selectedMedia.detected_type.slice(1)}
                  {selectedMedia.detection_confidence && ` (${Math.round(parseFloat(selectedMedia.detection_confidence) * 100)}%)`}
                </StatusValue>
              </DetailRow>
            )}
            {selectedMedia.suggested_entity_type && (
              <DetailRow>
                <DetailLabel>Linked Entity:</DetailLabel>
                <DetailValue>
                  {selectedMedia.suggested_entity_type.charAt(0).toUpperCase() + selectedMedia.suggested_entity_type.slice(1)}
                  {selectedMedia.suggested_entity_id && ` (ID: ${selectedMedia.suggested_entity_id})`}
                </DetailValue>
              </DetailRow>
            )}
          </SidebarSection>
        </SidebarDetailsWrapper>
      </SidebarContent>
    </>
  );

  // Status bar content
  const statusBarContent = (
    <BottomBarInner hasActions={selectedItems.size > 0}>
      {selectedItems.size > 0 ? (
        <>
          <BottomBarText>
            <strong>{selectedItems.size}</strong> {selectedItems.size === 1 ? 'item' : 'items'} selected
          </BottomBarText>
          <BottomBarActions>
            <BottomBarButton onClick={handleEdit}>
              <FaEye /> Edit
            </BottomBarButton>
            <BottomBarButton danger onClick={handleDelete}>
              <FaTrash /> Delete
            </BottomBarButton>
          </BottomBarActions>
        </>
      ) : (
        <BottomBarText>
          <strong>{media.length}</strong> of <strong>{totalItems}</strong>
        </BottomBarText>
      )}
    </BottomBarInner>
  );

  return (
    <AdminLayout 
      currentPage="media"
      rightSidebar={sidebarContent}
      rightSidebarOpen={sidebarOpen}
      rightSidebarWidth={400}
      statusBar={statusBarContent}
    >
      <Container>
        <Header>
          <HeaderLeft>
            <Title>Media Library</Title>
            <Subtitle>Upload and manage your media files</Subtitle>
          </HeaderLeft>
          <UploadButton onClick={() => setShowUploadModal(true)}>
            <FaPlus /> Upload Files
          </UploadButton>
        </Header>

        <Toolbar>
          <ToolbarLeft>
            <SearchInput
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <FilterContainer ref={filterDropdownRef}>
              <FilterButton 
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                onMouseEnter={() => setFilterButtonHovered(true)}
                onMouseLeave={() => setFilterButtonHovered(false)}
                $hasActiveFilters={countActiveFilters() > 0}
              >
                <FaFilter />
                Filters
                {countActiveFilters() > 0 && (
                  <FilterBadge 
                    $isHovered={filterButtonHovered}
                    onClick={(e) => {
                      if (filterButtonHovered) {
                        e.stopPropagation();
                        resetFilters(false);
                      }
                    }}
                    title={filterButtonHovered ? "Clear all filters" : `${countActiveFilters()} active filter${countActiveFilters() > 1 ? 's' : ''}`}
                  >
                    {filterButtonHovered ? '×' : countActiveFilters()}
                  </FilterBadge>
                )}
              </FilterButton>
              
              <FilterDropdownPanel $isOpen={filterDropdownOpen}>
                <FilterSection>
                  <FilterLabel>Media Source</FilterLabel>
                  <FilterSelect
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    <option value="all">All Sources</option>
                    <option value="local">Local Upload</option>
                    <option value="gdrive">Google Drive</option>
                  </FilterSelect>
                </FilterSection>

                <FilterSection>
                  <FilterLabel>Detected Type</FilterLabel>
                  <FilterSelect
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="tattoo">Tattoos</option>
                    <option value="artwork">Artwork</option>
                    <option value="unknown">Unknown</option>
                  </FilterSelect>
                </FilterSection>

                <FilterSection>
                  <FilterLabel>Confidence Level</FilterLabel>
                  <FilterSelect
                    value={confidenceFilter}
                    onChange={(e) => setConfidenceFilter(e.target.value)}
                  >
                    <option value="all">All Confidence</option>
                    <option value="high">High (80%+)</option>
                    <option value="medium">Medium (60-80%)</option>
                    <option value="low">Low (30-60%)</option>
                    <option value="none">No Classification</option>
                  </FilterSelect>
                </FilterSection>

                <FilterSection>
                  <FilterLabel>Date Range</FilterLabel>
                  <FilterSelect
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </FilterSelect>
                </FilterSection>

                <FilterActions>
                  <FilterActionButton onClick={() => resetFilters()} $variant="secondary">
                    Clear All
                  </FilterActionButton>
                  <FilterActionButton onClick={() => setFilterDropdownOpen(false)} $variant="primary">
                    Apply
                  </FilterActionButton>
                </FilterActions>
              </FilterDropdownPanel>
            </FilterContainer>
          </ToolbarLeft>

          <ToolbarRight>
            <ViewToggleGroup>
              <ViewToggleButton
                active={viewFormat === 'tile'}
                onClick={() => setViewFormat('tile')}
                title="Grid View"
              >
                <FaTh />
              </ViewToggleButton>
              <ViewToggleButton
                active={viewFormat === 'list'}
                onClick={() => setViewFormat('list')}
                title="List View"
              >
                <FaList />
              </ViewToggleButton>
            </ViewToggleGroup>
          </ToolbarRight>
        </Toolbar>

        {showUploadModal && (
          <UploadSection>
            <UploadHeader>
              <UploadIcon>
                <FaPlus />
              </UploadIcon>
              <UploadText>
                <h3>Upload New Media</h3>
                <p>Drag and drop multiple images and videos or click to browse.</p>
              </UploadText>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6c757d' }}
              >
                <FaTimes />
              </button>
            </UploadHeader>
            
            <UploadMedia 
              onUploadComplete={(urls) => {
                handleUploadComplete(urls);
                setShowUploadModal(false);
              }}
              accept="image/*,video/*"
            />
            
            {uploadSuccess && (
              <UploadSuccess>
                ✓ {uploadSuccess}
              </UploadSuccess>
            )}
          </UploadSection>
        )}

        {loading ? (
          <LoadingContainer>
            <FaSpinner className="spinner" />
            <p>Loading media...</p>
          </LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <p>Error: {error}</p>
            <RetryButton onClick={fetchMedia}>Retry</RetryButton>
          </ErrorContainer>
        ) : (
          <>
            {viewFormat === 'tile' ? (
              <TileGrid>
                {filterMediaByClassification(media).map((item) => (
                  <MediaItemWithProcessing key={item.id} item={item}>
                    <TileItem 
                      onClick={() => handleMediaClick(item)}
                      selected={selectedMedia?.id === item.id}
                    >
                      <TileImage>
                        <TileCheckbox>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TileCheckbox>
                        {item.thumbnail_url || item.medium_url ? (
                          <img src={item.thumbnail_url || item.medium_url} alt={item.filename} />
                        ) : (
                          <PlaceholderImage>
                            <span>{item.mime_type.split('/')[0].toUpperCase()}</span>
                          </PlaceholderImage>
                        )}
                        {getEntityLinkIcon(item)}
                        {isProcessing(item) ? (
                          <MediaProcessingIndicator processing overlay />
                        ) : item.processing_status === 'failed' ? (
                          <MediaProcessingIndicator failed overlay />
                        ) : null}
                      </TileImage>
                    </TileItem>
                  </MediaItemWithProcessing>
                ))}
              </TileGrid>
            ) : viewFormat === 'list' ? (
              <MediaTable>
                <TableHeader>
                  <TableHeaderCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filterMediaByClassification(media).length && filterMediaByClassification(media).length > 0}
                      onChange={handleSelectAll}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6', borderRadius: '4px' }}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                  <TableHeaderCell>File</TableHeaderCell>
                  <TableHeaderCell className="hide-mobile">Type</TableHeaderCell>
                  <TableHeaderCell>Uploaded</TableHeaderCell>
                </TableHeader>
                {filterMediaByClassification(media).map((item) => (
                  <MediaItemWithProcessing key={item.id} item={item}>
                    <TableRow 
                      onClick={() => handleMediaClick(item)}
                      selected={selectedMedia?.id === item.id}
                    >
                      <TableCell>
                        <TableCheckbox>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCheckbox>
                      </TableCell>
                      <TableCell>
                        <ListThumbnail>
                          {item.thumbnail_url || item.medium_url ? (
                            <img src={item.thumbnail_url || item.medium_url} alt={item.filename} />
                          ) : (
                            <PlaceholderImage>
                              <span style={{ fontSize: '0.8rem' }}>
                                {item.mime_type.split('/')[0].toUpperCase()}
                              </span>
                            </PlaceholderImage>
                          )}
                          {isProcessing(item) && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FaSpinner style={{ animation: 'spin 1s linear infinite', color: '#96885f' }} />
                            </div>
                          )}
                        </ListThumbnail>
                      </TableCell>
                      <TableCell>
                        <FileInfo>
                          <FileName>{item.title || item.filename}</FileName>
                          <FileSubtext>{item.filename}</FileSubtext>
                        </FileInfo>
                      </TableCell>
                      <TableCell className="hide-mobile">
                        {item.mime_type.split('/')[0].charAt(0).toUpperCase() + item.mime_type.split('/')[0].slice(1)}
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                    </TableRow>
                  </MediaItemWithProcessing>
                ))}
              </MediaTable>
            ) : (
              <MediaGrid>
                {filterMediaByClassification(media).map((item) => (
                  <MediaItemWithProcessing key={item.id} item={item}>
                    <MediaCard>
                      <MediaThumbnail>
                        {item.thumbnail_url || item.medium_url ? (
                          <img src={item.thumbnail_url || item.medium_url} alt={item.alt_text || item.filename} />
                        ) : (
                          <PlaceholderThumbnail>
                            <span>{item.mime_type.split('/')[0].toUpperCase()}</span>
                          </PlaceholderThumbnail>
                        )}
                        {getEntityLinkIcon(item)}
                        {isProcessing(item) && (
                          <MediaProcessingIndicator processing overlay />
                        )}
                        {item.processing_status === 'failed' && (
                          <MediaProcessingIndicator failed overlay />
                        )}
                      </MediaThumbnail>
                      
                      <MediaInfo>
                        <CardTitle>{item.title || item.filename}</CardTitle>
                      <MediaDetails>
                        <DetailItem>
                          <DetailLabel>Size:</DetailLabel>
                          <DetailValue>{formatFileSize(item.size)}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Dimensions:</DetailLabel>
                          <DetailValue>
                            {item.width && item.height 
                              ? `${item.width} × ${item.height}` 
                              : 'Processing...'}
                          </DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Source:</DetailLabel>
                          <DetailValue>{item.source}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Type:</DetailLabel>
                          <DetailValue>{item.mime_type}</DetailValue>
                        </DetailItem>
                      </MediaDetails>
                      
                      {item.description && (
                        <MediaDescription>{item.description}</MediaDescription>
                      )}
                      
                      {item.tags && item.tags.length > 0 && (
                        <TagsContainer>
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                          ))}
                          {item.tags.length > 3 && (
                            <Tag>+{item.tags.length - 3} more</Tag>
                          )}
                        </TagsContainer>
                      )}
                    </MediaInfo>
                    
                    <MediaActions>
                      {item.spaces_url && (
                        <ActionButton onClick={() => window.open(item.spaces_url, '_blank')}>
                          <FaEye />
                        </ActionButton>
                      )}
                      <ActionButton onClick={() => window.open(item.spaces_url, '_blank')}>
                        <FaDownload />
                      </ActionButton>
                      <ActionButton danger onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingle(item.id);
                      }}>
                        <FaTrash />
                      </ActionButton>
                    </MediaActions>
                    </MediaCard>
                  </MediaItemWithProcessing>
                ))}
              </MediaGrid>
            )}

            {totalPages > 1 && (
              <Pagination>
                <PaginationButton
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </PaginationButton>
                
                <PageInfo>
                  Page {currentPage} of {totalPages}
                </PageInfo>
                
                <PaginationButton
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </PaginationButton>
              </Pagination>
            )}
          </>
        )}

      </Container>
    </AdminLayout>
  );
} 