'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaEdit, FaTrash, FaPlus, FaEye, FaGripVertical } from 'react-icons/fa';
import Image from 'next/image';
import { getArtist } from '@/lib/db';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, ActionButtons, ImageCell, TitleCell, LoadingState, ErrorState, EmptyState } from '@/components/AdminTableStyles';
import { Tattoo } from '@/components/TattooForm';
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
function SortableTattooRow({ 
  tattoo, 
  onEdit, 
  onView, 
  onDelete 
}: { 
  tattoo: Tattoo; 
  onEdit: (tattoo: Tattoo) => void;
  onView: (tattoo: Tattoo) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tattoo.id! });

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
          {tattoo.image && (
            <Image
              src={tattoo.image}
              alt={tattoo.title}
              fill
              style={{ objectFit: 'cover' }}
            />
          )}
        </ImageCell>
      </Td>
      <Td>
        <TitleCell>
          <strong>{tattoo.title}</strong>
          {tattoo.description && (
            <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
              {tattoo.description.substring(0, 50)}...
            </div>
          )}
        </TitleCell>
      </Td>
      <Td>{tattoo.artist?.name || 'Unknown'}</Td>
      <Td>{tattoo.category || '-'}</Td>
      <Td>{tattoo.placement || '-'}</Td>
      <Td>{tattoo.size || '-'}</Td>
      <Td>
        <ActionButtons>
          <ActionButton
            className="view"
            onClick={() => onView(tattoo)}
            title="View"
          >
            <FaEye />
          </ActionButton>
          <ActionButton
            className="edit"
            onClick={() => onEdit(tattoo)}
            title="Edit"
          >
            <FaEdit />
          </ActionButton>
          <ActionButton
            className="delete"
            onClick={() => onDelete(tattoo.id!)}
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
      currentPage: 'Tattoos'
    }
  }
}

export default function AdminTattoosPage() {
  const router = useRouter();
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTattoos();
  }, []);

  const fetchTattoos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tattoos');
      if (!response.ok) {
        throw new Error('Failed to fetch tattoos');
      }
      const data = await response.json();
      setTattoos(data.data || []);
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

    const oldIndex = tattoos.findIndex((t) => t.id === active.id);
    const newIndex = tattoos.findIndex((t) => t.id === over.id);

    // Update local state immediately for smooth UX
    const reorderedTattoos = arrayMove(tattoos, oldIndex, newIndex);
    setTattoos(reorderedTattoos);

    // Prepare updates with new sort_order values
    const updates = reorderedTattoos.map((tattoo, index) => ({
      id: tattoo.id!,
      sort_order: index,
    }));

    try {
      const response = await fetch('/api/tattoos/reorder', {
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
      fetchTattoos(); // Refetch to reset order
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tattoo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tattoos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tattoo');
      }

      setTattoos(tattoos.filter(tattoo => tattoo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tattoo');
    }
  };

  const handleEdit = (tattoo: Tattoo) => {
    router.push(`/admin/tattoos/edit/${tattoo.id}`);
  };

  const handleView = (tattoo: Tattoo) => {
    window.open(`/tattoos/${tattoo.slug}`, '_blank');
  };

  const handleCreateNew = () => {
    router.push('/admin/tattoos/create');
  };

  if (loading) {
    return (
      <AdminLayout currentPage="tattoos">
        <LoadingState>Loading tattoos...</LoadingState>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="tattoos">
      <AdminContainer>
        <Header>
          <Title>Tattoo Management</Title>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <AddButton onClick={handleCreateNew}>
              <FaPlus /> Add Tattoo
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
          {tattoos.length === 0 ? (
            <EmptyState>
              <h3>No tattoos found</h3>
              <p>Get started by adding your first tattoo.</p>
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
                    <Th width="40px"></Th>
                    <Th>Image</Th>
                    <Th>Title</Th>
                    <Th>Artist</Th>
                    <Th>Category</Th>
                    <Th>Placement</Th>
                    <Th>Size</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <SortableContext
                  items={tattoos.map((t) => t.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {tattoos.map((tattoo) => (
                      <SortableTattooRow
                        key={tattoo.id}
                        tattoo={tattoo}
                        onEdit={handleEdit}
                        onView={handleView}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </Table>
            </DndContext>
          )}
        </TableContainer>
      </AdminContainer>
    </AdminLayout>
  );
}

