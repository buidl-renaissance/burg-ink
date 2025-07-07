'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaPalette, FaUsers, FaCalendar, FaEnvelope, FaImages } from 'react-icons/fa';
import Link from 'next/link';
import { GetServerSideProps } from 'next';

interface DashboardStats {
  totalArtworks: number;
  totalUsers: number;
  totalEvents: number;
  totalEmails: number;
  totalMedia: number;
  totalViews: number;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Dashboard'
    }
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalArtworks: 0,
    totalUsers: 0,
    totalEvents: 0,
    totalEmails: 0,
    totalMedia: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch actual stats from your API
    // For now, we'll simulate loading some data
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch media stats
        const mediaResponse = await fetch('/api/media/stats');
        const mediaStats = mediaResponse.ok ? await mediaResponse.json() : { total: 0 };
        
        // Mock data for other stats - replace with actual API calls
        setStats({
          totalArtworks: 25,
          totalUsers: 150,
          totalEvents: 8,
          totalEmails: 45,
          totalMedia: mediaStats.total,
          totalViews: 1250,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, href, color }: {
    title: string;
    value: number;
    icon: React.ComponentType;
    href?: string;
    color: string;
  }) => {
    const Card = styled.div`
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: ${href ? 'pointer' : 'default'};

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }

      @media (max-width: 768px) {
        padding: 1rem;
        border-radius: 8px;
      }
    `;

    const IconWrapper = styled.div`
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      margin-bottom: 1rem;

      @media (max-width: 768px) {
        width: 40px;
        height: 40px;
        font-size: 1.25rem;
        margin-bottom: 0.75rem;
      }
    `;

    const Title = styled.h3`
      font-size: 0.9rem;
      color: #6c757d;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      @media (max-width: 768px) {
        font-size: 0.8rem;
        margin: 0 0 0.25rem 0;
      }
    `;

    const Value = styled.div`
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin: 0;

      @media (max-width: 768px) {
        font-size: 1.5rem;
      }
    `;

    const content = (
      <>
        <IconWrapper>
          <Icon />
        </IconWrapper>
        <Title>{title}</Title>
        <Value>{loading ? '...' : value.toLocaleString()}</Value>
      </>
    );

    if (href) {
      return (
        <Link href={href} style={{ textDecoration: 'none' }}>
          <Card>{content}</Card>
        </Link>
      );
    }

    return <Card>{content}</Card>;
  };

  return (
    <AdminLayout currentPage="dashboard">
      <DashboardContainer>
        <Header>
          <Title>Dashboard</Title>
          <Subtitle>Welcome to your admin panel</Subtitle>
        </Header>

        <StatsGrid>
          <StatCard
            title="Total Artworks"
            value={stats.totalArtworks}
            icon={FaPalette}
            href="/admin/artwork"
            color="#96885f"
          />
          <StatCard
            title="Total Media"
            value={stats.totalMedia}
            icon={FaImages}
            href="/admin/media"
            color="#17a2b8"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={FaUsers}
            href="/admin/users"
            color="#007bff"
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={FaCalendar}
            href="/admin/events"
            color="#28a745"
          />
          <StatCard
            title="Total Emails"
            value={stats.totalEmails}
            icon={FaEnvelope}
            href="/admin/emails"
            color="#ffc107"
          />
        </StatsGrid>

        <QuickActions>
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionsGrid>
            <ActionCard href="/admin/artwork">
              <ActionIcon>🎨</ActionIcon>
              <ActionTitle>Manage Artwork</ActionTitle>
              <ActionDescription>Add, edit, or remove artwork from your gallery</ActionDescription>
            </ActionCard>
            <ActionCard href="/admin/media">
              <ActionIcon>🖼️</ActionIcon>
              <ActionTitle>Manage Media</ActionTitle>
              <ActionDescription>View and manage media files and assets</ActionDescription>
            </ActionCard>
            <ActionCard href="/admin/users">
              <ActionIcon>👥</ActionIcon>
              <ActionTitle>Manage Users</ActionTitle>
              <ActionDescription>View and manage user accounts and permissions</ActionDescription>
            </ActionCard>
            <ActionCard href="/admin/events">
              <ActionIcon>📅</ActionIcon>
              <ActionTitle>Manage Events</ActionTitle>
              <ActionDescription>Create and manage upcoming events</ActionDescription>
            </ActionCard>
            <ActionCard href="/admin/emails">
              <ActionIcon>📧</ActionIcon>
              <ActionTitle>Manage Emails</ActionTitle>
              <ActionDescription>Compose and manage email campaigns</ActionDescription>
            </ActionCard>
            <ActionCard href="/admin/marketing-assistant">
              <ActionIcon>💡</ActionIcon>
              <ActionTitle>Marketing Assistant</ActionTitle>
              <ActionDescription>AI-powered marketing guidance for artists</ActionDescription>
            </ActionCard>
            <ActionCard href="/admin/settings">
              <ActionIcon>⚙️</ActionIcon>
              <ActionTitle>Site Settings</ActionTitle>
              <ActionDescription>Configure site preferences and appearance</ActionDescription>
            </ActionCard>
          </ActionsGrid>
        </QuickActions>
      </DashboardContainer>
    </AdminLayout>
  );
}

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
`;

const QuickActions = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1.5rem 0;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const ActionCard = styled(Link)`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  color: inherit;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 8px;
  }
`;

const ActionIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

const ActionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin: 0 0 0.25rem 0;
  }
`;

const ActionDescription = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.8rem;
    line-height: 1.4;
  }
`; 