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

interface User {
  id: number;
  cid: string;
  name: string;
  email: string;
  created_at: string;
}

export function AdminUsers({ users }: { users: User[] }) {
  const columnDefs: ColDef[] = [
    { 
      field: 'name',
      headerName: 'Name',
      flex: 1
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1
    },
    {
      field: 'cid',
      headerName: 'CID',
      width: 120
    },
    {
      field: 'created_at',
      headerName: 'Joined',
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
        rowData={users}
        height="600px"
      />
    </Container>
  );
}
