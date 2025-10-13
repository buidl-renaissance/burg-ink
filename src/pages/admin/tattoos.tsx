'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import Image from 'next/image';
import { getArtist } from '@/lib/db';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, ActionButtons, ImageCell, TitleCell, LoadingState, ErrorState, EmptyState } from '@/components/AdminTableStyles';
import { Tattoo } from '@/components/TattooForm';

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
      currentPage: 'Tattoos'
    }
  }
}

export default function AdminTattoosPage() {
  const router = useRouter();
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <Table>
              <thead>
                <tr>
                  <Th>Image</Th>
                  <Th>Title</Th>
                  <Th>Artist</Th>
                  <Th>Category</Th>
                  <Th>Placement</Th>
                  <Th>Size</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {tattoos.map((tattoo) => (
                  <tr key={tattoo.id}>
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
                          onClick={() => handleView(tattoo)}
                          title="View"
                        >
                          <FaEye />
                        </ActionButton>
                        <ActionButton
                          className="edit"
                          onClick={() => handleEdit(tattoo)}
                          title="Edit"
                        >
                          <FaEdit />
                        </ActionButton>
                        <ActionButton
                          className="delete"
                          onClick={() => handleDelete(tattoo.id!)}
                          title="Delete"
                        >
                          <FaTrash />
                        </ActionButton>
                      </ActionButtons>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </TableContainer>
      </AdminContainer>
    </AdminLayout>
  );
}

