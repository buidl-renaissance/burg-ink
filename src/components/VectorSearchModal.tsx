import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #96885f;
  }
`;

const SearchButton = styled.button`
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #7a6f4d;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  margin-top: 1.5rem;
`;

const ResultItem = styled.div`
  padding: 1rem;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #96885f;
    background: white;
    box-shadow: 0 2px 8px rgba(150, 136, 95, 0.1);
  }
`;

const ResultTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
`;

const ResultDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
`;

const ResultMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #888;
`;

const SimilarityScore = styled.span`
  background: #96885f;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
`;

const LoadingText = styled.div`
  text-align: center;
  color: #666;
  margin: 1rem 0;
`;

const ErrorText = styled.div`
  text-align: center;
  color: #dc3545;
  margin: 1rem 0;
`;

const EmptyText = styled.div`
  text-align: center;
  color: #666;
  margin: 1rem 0;
`;

interface SearchResult {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  image: string | null;
  category: string | null;
  similarity: number;
}

interface VectorSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtwork: (artwork: SearchResult) => void;
}

export default function VectorSearchModal({ isOpen, onClose, onSelectArtwork }: VectorSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/artwork/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 20 }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Failed to search artwork. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onSelectArtwork(result);
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>

        <Title>AI-Powered Artwork Search</Title>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search artwork by description, style, content, or any natural language query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <SearchButton 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            <FaSearch />
            {loading ? 'Searching...' : 'Search Artwork'}
          </SearchButton>
        </SearchContainer>

        {loading && (
          <LoadingText>Searching for similar artwork...</LoadingText>
        )}

        {error && (
          <ErrorText>{error}</ErrorText>
        )}

        {results.length > 0 && (
          <ResultsContainer>
            <h3>Search Results ({results.length} found)</h3>
            {results.map((result) => (
              <ResultItem 
                key={result.id}
                onClick={() => handleResultClick(result)}
              >
                <ResultTitle>{result.title}</ResultTitle>
                {result.description && (
                  <ResultDescription>{result.description}</ResultDescription>
                )}
                <ResultMeta>
                  <span>Category: {result.category || 'Uncategorized'}</span>
                  <SimilarityScore>
                    {(result.similarity * 100).toFixed(1)}% match
                  </SimilarityScore>
                </ResultMeta>
              </ResultItem>
            ))}
          </ResultsContainer>
        )}

        {!loading && !error && results.length === 0 && query && (
          <EmptyText>No artwork found matching your query.</EmptyText>
        )}
      </ModalContent>
    </ModalOverlay>
  );
} 