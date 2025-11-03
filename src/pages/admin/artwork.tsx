'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { Artwork } from '@/utils/interfaces';
import { AdminLayout } from '@/components/AdminLayout';
import { StatusDropdown } from '@/components/StatusDropdown';
import { FaEdit, FaTrash, FaPlus, FaEye, FaDownload, FaGripVertical } from 'react-icons/fa';
import Image from 'next/image';
import { ImportArtworkModal } from '@/components/ImportArtworkModal';
import { Artist } from '@/utils/interfaces';
import { getArtist } from '@/lib/db';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, ActionButtons, ImageCell, TitleCell, LoadingState, ErrorState, EmptyState } from '@/components/AdminTableStyles';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const DragHandle = styled.div`
  cursor: grab;
  color: #999;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  
  &:active {
    cursor: grabbing;
  }
  
  &:hover {
    color: #666;
  }
`;

const SortableRow = styled.tr<{ $isDragging?: boolean }>`
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  background: ${props => props.$isDragging ? '#f0f0f0' : 'transparent'};
`;

// Sortable row component
function SortableArtworkRow({ 
  artwork, 
  onEdit, 
  onView, 
  onDelete, 
  onError 
}: { 
  artwork: Artwork; 
  onEdit: (artwork: Artwork) => void;
  onView: (artwork: Artwork) => void;
  onDelete: (id: number) => void;
  onError: (error: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artwork.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SortableRow ref={setNodeRef} style={style} $isDragging={isDragging}>
      <Td width="40px">
        <DragHandle {...attributes} {...listeners}>
          <FaGripVertical />
        </DragHandle>
      </Td>
      <Td width="80px">
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
          onError={onError}
        />
      </Td>
      <Td>
        <ActionButtons>
          <ActionButton
            className="view"
            onClick={() => onView(artwork)}
            title="View"
          >
            <FaEye />
          </ActionButton>
          <ActionButton
            className="edit"
            onClick={() => onEdit(artwork)}
            title="Edit"
          >
            <FaEdit />
          </ActionButton>
          <ActionButton
            className="delete"
            onClick={() => onDelete(artwork.id)}
            title="Delete"
          >
            <FaTrash />
          </ActionButton>
        </ActionButtons>
      </Td>
    </SortableRow>
  );
}

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
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = artworks.findIndex((a) => a.id === active.id);
    const newIndex = artworks.findIndex((a) => a.id === over.id);

    // Update local state immediately for smooth UX
    const reorderedArtworks = arrayMove(artworks, oldIndex, newIndex);
    setArtworks(reorderedArtworks);

    // Prepare updates with new sort_order values
    const updates = reorderedArtworks.map((artwork, index) => ({
      id: artwork.id,
      sort_order: index,
    }));

    try {
      const response = await fetch('/api/artwork/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }
    } catch (err) {
      // Revert on error
      setError(err instanceof Error ? err.message : 'Failed to update order');
      fetchArtworks(); // Refetch to reset order
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
    router.push(`/admin/artwork/edit/${artwork.id}`);
  };

  const handleView = (artwork: Artwork) => {
    window.open(`/artwork/${artwork.slug}`, '_blank');
  };

  const handleCreateNew = () => {
    router.push('/admin/artwork/create');
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
            <AddButton onClick={handleCreateNew}>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: '40px' }}></Th>
                    <Th>Image</Th>
                    <Th>Title</Th>
                    <Th>Artist</Th>
                    <Th>Category</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <SortableContext
                  items={artworks.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {artworks.map((artwork) => (
                      <SortableArtworkRow
                        key={artwork.id}
                        artwork={artwork}
                        onEdit={handleEdit}
                        onView={handleView}
                        onDelete={handleDelete}
                        onError={setError}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </Table>
            </DndContext>
          )}
        </TableContainer>

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