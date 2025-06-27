'use client';

import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styled from 'styled-components';

const TableWrapper = styled.div`
  width: 100%;
  height: 100%;

  .ag-theme-alpine {
    --ag-background-color: ${({ theme }) => theme.background};
    --ag-header-background-color: ${({ theme }) => theme.backgroundSecondary};
    --ag-odd-row-background-color: ${({ theme }) => theme.backgroundSecondary};
    --ag-header-foreground-color: ${({ theme }) => theme.text};
    --ag-foreground-color: ${({ theme }) => theme.text};
    --ag-border-color: ${({ theme }) => theme.border};
    --ag-row-hover-color: ${({ theme }) => theme.backgroundSecondary};
    --ag-selected-row-background-color: ${({ theme }) => theme.accent};
    
    font-family: inherit;
  }
`;

interface TableProps {
  columnDefs: ColDef[];
  rowData: unknown[];
  onGridReady?: (params: GridReadyEvent) => void;
  onRowClicked?: (event: RowClickedEvent) => void;
  defaultColDef?: ColDef;
  height?: string;
}

export function Table({
  columnDefs,
  rowData,
  onGridReady,
  onRowClicked,
  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  },
  height = '500px'
}: TableProps) {
  return (
    <TableWrapper>
      <div className="ag-theme-alpine" style={{ height, width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          animateRows={true}
          rowSelection="single"
        />
      </div>
    </TableWrapper>
  );
}
