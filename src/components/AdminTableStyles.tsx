import styled from 'styled-components';

export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: scroll;
  max-width: calc(100vw - 2rem);
  width: 100%;
  margin: 0 auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e9ecef;

  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
`;

export const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;

  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
`;

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

export const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

export const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

export const ErrorState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #dc3545;
  background: #f8d7da;
  border-radius: 8px;
  margin: 1rem 0;
`;

export const ImageCell = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: #f8f9fa;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

export const TitleCell = styled.div`
  max-width: 200px;

  @media (max-width: 768px) {
    max-width: 150px;
    min-width: 125px;
    white-space: normal;
    word-break: break-word;
  }
`;


export const ActionButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#f8f9fa'};
  color: ${props => props.danger ? 'white' : '#333'};
  border: 1px solid ${props => props.danger ? '#dc3545' : '#dee2e6'};
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;

  @media (max-width: 768px) {
    padding: 0.5rem 0.625rem;
    font-size: 0.85rem;
  }

  &.edit {
    background: #e7f3ff;
    color: #0066cc;
    border-color: #b3d9ff;
    
    &:hover {
      background: #cce5ff;
      border-color: #99ccff;
    }
  }

  &.delete {
    background: #ffe6e6;
    color: #cc0000;
    border-color: #ffcccc;
    
    &:hover {
      background: #ffcccc;
      border-color: #ff9999;
    }
  }

  &.view {
    background: #e6f7ed;
    color: #1e7e34;
    border-color: #b3e6cc;
    
    &:hover {
      background: #ccf0dd;
      border-color: #99e6bb;
    }
  }

  &.send {
    background: #f5f3ed;
    color: #96885f;
    border-color: #d9d3c2;
    
    &:hover {
      background: #ebe7db;
      border-color: #c9c1aa;
    }
  }

  &:hover {
    background: ${props => props.danger ? '#c82333' : '#e9ecef'};
    border-color: ${props => props.danger ? '#bd2130' : '#cbd3da'};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;
