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
  background: ${props => props.danger ? '#dc3545' : '#6c757d'};
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    padding: 0.4rem;
    font-size: 0.8rem;
  }

  &.edit {
    color: #007bff;
  }

  &.delete {
    color: #dc3545;
  }

  &.view {
    color: #28a745;
  }

  &:hover {
    background: ${props => props.danger ? '#c82333' : '#5a6268'};
  }
`;
