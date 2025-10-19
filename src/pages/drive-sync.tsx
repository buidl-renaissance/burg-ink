'use client';

import { DriveSync } from '@/components/DriveSync';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  /* Navbar spacing handled by global .navbar-visible class */
`;

const PageTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  color: #333;
`;

export default function DriveSyncPage() {
  return (
    <PageContainer>
      <PageTitle>Google Drive Sync</PageTitle>
      <DriveSync />
    </PageContainer>
  );
} 