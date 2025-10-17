'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSpinner, FaDownload, FaSearch, FaFilter } from 'react-icons/fa';
import { TaxonomyManager } from '../../components/TaxonomyManager';
import { AdminLayout } from '../../components/AdminLayout';

interface TaxonomyNamespace {
  namespace: string;
  count: number;
  active_count: number;
}

interface TaxonomyStats {
  total_namespaces: number;
  total_items: number;
  active_items: number;
}

export default function TaxonomiesAdmin() {
  const [namespaces, setNamespaces] = useState<TaxonomyNamespace[]>([]);
  const [stats, setStats] = useState<TaxonomyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all taxonomies to get namespace stats
      const response = await fetch('/api/taxonomy');
      if (!response.ok) {
        throw new Error('Failed to fetch taxonomy data');
      }

      const data = await response.json();
      const taxonomies = data.taxonomies || [];

      // Group by namespace and calculate stats
      const namespaceMap = new Map<string, { total: number; active: number }>();
      
      taxonomies.forEach((item: Record<string, unknown>) => {
        const existing = namespaceMap.get(String(item.namespace)) || { total: 0, active: 0 };
        existing.total++;
        if (item.is_active === 1) {
          existing.active++;
        }
        namespaceMap.set(String(item.namespace), existing);
      });

      const namespaceList: TaxonomyNamespace[] = Array.from(namespaceMap.entries())
        .map(([namespace, counts]) => ({
          namespace,
          count: counts.total,
          active_count: counts.active
        }))
        .sort((a, b) => a.namespace.localeCompare(b.namespace));

      setNamespaces(namespaceList);
      setStats({
        total_namespaces: namespaceList.length,
        total_items: taxonomies.length,
        active_items: taxonomies.filter((item: Record<string, unknown>) => item.is_active === 1).length
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch taxonomy data');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTaxonomies = async () => {
    try {
      setSeeding(true);
      const response = await fetch('/api/taxonomy/seed', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to seed taxonomies');
      }

      await fetchData();
      alert('Taxonomies seeded successfully!');
    } catch (err) {
      alert(`Failed to seed taxonomies: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleNamespaceUpdate = () => {
    fetchData();
  };

  const filteredNamespaces = namespaces.filter(ns =>
    ns.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <LoadingContainer>
          <FaSpinner className="spinner" />
          Loading taxonomy data...
        </LoadingContainer>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <ErrorContainer>
          <ErrorMessage>{error}</ErrorMessage>
          <RetryButton onClick={fetchData}>Retry</RetryButton>
        </ErrorContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container>
        <Header>
          <HeaderLeft>
            <Title>Taxonomy Management</Title>
            <Subtitle>
              Manage categorization and tagging systems for content classification
            </Subtitle>
          </HeaderLeft>
          <HeaderActions>
            <SeedButton onClick={handleSeedTaxonomies} disabled={seeding}>
              {seeding ? <FaSpinner className="spinner" /> : <FaDownload />}
              {seeding ? 'Seeding...' : 'Seed Defaults'}
            </SeedButton>
            <RefreshButton onClick={fetchData}>
              Refresh
            </RefreshButton>
          </HeaderActions>
        </Header>

        {stats && (
          <StatsContainer>
            <StatCard>
              <StatNumber>{stats.total_namespaces}</StatNumber>
              <StatLabel>Namespaces</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{stats.total_items}</StatNumber>
              <StatLabel>Total Items</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{stats.active_items}</StatNumber>
              <StatLabel>Active Items</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{Math.round((stats.active_items / stats.total_items) * 100)}%</StatNumber>
              <StatLabel>Active Rate</StatLabel>
            </StatCard>
          </StatsContainer>
        )}

        <FiltersContainer>
          <SearchContainer>
            <SearchIcon><FaSearch /></SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search namespaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <FilterContainer>
            <FilterIcon><FaFilter /></FilterIcon>
            <FilterSelect
              value={selectedNamespace || ''}
              onChange={(e) => setSelectedNamespace(e.target.value || null)}
            >
              <option value="">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns.namespace} value={ns.namespace}>
                  {ns.namespace} ({ns.count} items)
                </option>
              ))}
            </FilterSelect>
          </FilterContainer>
        </FiltersContainer>

        <NamespacesList>
          {filteredNamespaces
            .filter(ns => !selectedNamespace || ns.namespace === selectedNamespace)
            .map(namespace => (
              <TaxonomyManager
                key={namespace.namespace}
                namespace={namespace.namespace}
                onUpdate={handleNamespaceUpdate}
              />
            ))}
        </NamespacesList>

        {filteredNamespaces.length === 0 && (
          <EmptyState>
            <EmptyIcon>🏷️</EmptyIcon>
            <EmptyTitle>No Taxonomies Found</EmptyTitle>
            <EmptyDescription>
              {searchTerm 
                ? `No namespaces match "${searchTerm}"`
                : 'No taxonomy namespaces exist yet'
              }
            </EmptyDescription>
            <EmptyActions>
              <SeedButton onClick={handleSeedTaxonomies} disabled={seeding}>
                {seeding ? <FaSpinner className="spinner" /> : <FaDownload />}
                {seeding ? 'Seeding...' : 'Seed Default Taxonomies'}
              </SeedButton>
            </EmptyActions>
          </EmptyState>
        )}
      </Container>
    </AdminLayout>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 2rem;
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const SeedButton = styled.button`
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #047857;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const RefreshButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.9rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterContainer = styled.div`
  position: relative;
`;

const FilterIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.9rem;
`;

const FilterSelect = styled.select`
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const NamespacesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
  font-size: 1.1rem;

  .spinner {
    animation: spin 1s linear infinite;
    margin-right: 0.75rem;
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
  padding: 4rem;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
`;

const RetryButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #b91c1c;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  text-align: center;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
`;

const EmptyDescription = styled.p`
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1rem;
`;

const EmptyActions = styled.div`
  display: flex;
  gap: 1rem;
`;
