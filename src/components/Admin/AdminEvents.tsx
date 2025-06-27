'use client';

import styled from 'styled-components';
import { Table } from '@/components/Table';
import type { ColDef } from 'ag-grid-community';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const Container = styled.div`
  padding: 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;

  &:hover {
    background: #f5f5f5;
  }

  &.edit { color: #007bff; }
  &.delete { color: #dc3545; }
  &.view { color: #28a745; }
`;

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  status: string;
  created_at: string;
}

export function AdminEvents({ events }: { events: Event[] }) {
  const columnDefs: ColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 1
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      headerName: 'Actions',
      width: 150,
      cellRenderer: () => (
        <ActionButtons>
          <IconButton className="view">
            <FaEye />
          </IconButton>
          <IconButton className="edit">
            <FaEdit />
          </IconButton>
          <IconButton className="delete">
            <FaTrash />
          </IconButton>
        </ActionButtons>
      )
    }
  ];

  return (
    <Container>
      <Table
        columnDefs={columnDefs}
        rowData={events}
        height="600px"
      />
    </Container>
  );
}
