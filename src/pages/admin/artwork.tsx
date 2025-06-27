'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Artwork } from '@/utils/interfaces';
import { ArtworkFormModal } from '@/components/ArtworkFormModal';
import { AdminLayout } from '@/components/AdminLayout';
import { StatusDropdown } from '@/components/StatusDropdown';
import { FaEdit, FaTrash, FaPlus, FaEye, FaDownload } from 'react-icons/fa';
import Image from 'next/image';
import { ImportArtworkModal } from '@/components/ImportArtworkModal';
import { Artist } from '@/utils/interfaces';
import { getArtist } from '@/lib/db';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, ImageCell, TitleCell, LoadingState, ErrorState, EmptyState } from '@/components/AdminTableStyles';

const AdminContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    text-align: center;
  }
`;

const AddButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background: #7a6f4d;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    justify-content: center;
  }
`;

export const getServerSideProps: GetServerSideProps = async () => {
  const artist = await getArtist(process.env.NEXT_PUBLIC_ARTIST_ID || '');
  return {
    props: {
      artist,
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Artwork'
    }
  }
}

export default function AdminArtworkPage({ artist }: { artist: Artist }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/artwork');
      if (!response.ok) {
        throw new Error('Failed to fetch artworks');
      }
      const data = await response.json();
      setArtworks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this artwork?')) {
      return;
    }

    try {
      const response = await fetch(`/api/artwork/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete artwork');
      }

      setArtworks(artworks.filter(artwork => artwork.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete artwork');
    }
  };

  const handleEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setIsModalOpen(true);
  };

  const handleView = (artwork: Artwork) => {
    window.open(`/artwork/${artwork.slug}`, '_blank');
  };

  const handleArtworkCreated = (artwork: Artwork) => {
    if (editingArtwork) {
      setArtworks(artworks.map(a => a.id === artwork.id ? artwork : a));
      setEditingArtwork(null);
    } else {
      setArtworks([artwork, ...artworks]);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingArtwork(null);
  };

  const handleImportArtwork = (imported: Artwork[]) => {
    setArtworks([
      ...imported.map((artwork) => ({
        ...artwork,
        id: Date.now() + Math.floor(Math.random() * 10000), // temp id
        slug: artwork.title?.toLowerCase().replace(/\s+/g, '-') || 'imported-artwork',
        type: 'artwork',
        data: { ...artwork.data, image: artwork.image, category: 'imported' },
        meta: {},
      })),
      ...artworks,
    ]);
  };

  if (loading) {
    return (
      <AdminLayout currentPage="artwork">
        <LoadingState>Loading artworks...</LoadingState>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="artwork">
      <AdminContainer>
        <Header>
          <Title>Artwork Management</Title>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <AddButton onClick={() => setIsModalOpen(true)}>
              <FaPlus /> Add Artwork
            </AddButton>
            <AddButton onClick={() => setIsImportModalOpen(true)}>
              <FaDownload /> Import Artwork
            </AddButton>
          </div>
        </Header>

        {error && (
          <ErrorState>
            Error: {error}
            <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>
              Dismiss
            </button>
          </ErrorState>
        )}

        <TableContainer>
          {artworks.length === 0 ? (
            <EmptyState>
              <h3>No artworks found</h3>
              <p>Get started by adding your first artwork.</p>
            </EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Image</Th>
                  <Th>Title</Th>
                  <Th>Artist</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {artworks.map((artwork) => (
                  <tr key={artwork.id}>
                    <Td>
                      <ImageCell>
                        {artwork.image && (
                          <Image
                            src={artwork.image}
                            alt={artwork.title}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </ImageCell>
                    </Td>
                    <Td>
                      <TitleCell>
                        <strong>{artwork.title}</strong>
                        {artwork.description && (
                          <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                            {artwork.description.substring(0, 50)}...
                          </div>
                        )}
                      </TitleCell>
                    </Td>
                    <Td>{artwork.artist?.name || 'Unknown'}</Td>
                    <Td>{artwork.data?.category || 'Uncategorized'}</Td>
                    <Td>
                      <StatusDropdown
                        artwork={artwork}
                        onError={setError}
                      />
                    </Td>
                    <Td>
                      <ActionButton
                        className="view"
                        onClick={() => handleView(artwork)}
                        title="View"
                      >
                        <FaEye />
                      </ActionButton>
                      <ActionButton
                        className="edit"
                        onClick={() => handleEdit(artwork)}
                        title="Edit"
                      >
                        <FaEdit />
                      </ActionButton>
                      <ActionButton
                        className="delete"
                        onClick={() => handleDelete(artwork.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </ActionButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </TableContainer>

        <ArtworkFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleArtworkCreated}
          title={editingArtwork ? 'Edit Artwork' : 'Create New Artwork'}
          artwork={editingArtwork}
        />

        <ImportArtworkModal
          artist={artist}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportArtwork}
        />
      </AdminContainer>
    </AdminLayout>
  );
} 