"use client";

import { useState, useEffect } from 'react';
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { FaPalette, FaTint, FaImages, FaHandshake, FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Hero from "@/components/Hero";
import { useAuth } from '@/utils/useAuth';

interface DashboardStats {
  artwork: {
    total: number;
    published: number;
    draft: number;
  };
  tattoos: {
    total: number;
    published: number;
    draft: number;
  };
  media: {
    total: number;
    processed: number;
    pending: number;
    failed: number;
  };
  contracts: {
    total: number;
    active: number;
    completed: number;
  };
  inquiries: {
    total: number;
    new: number;
    contacted: number;
    completed: number;
  };
  profile: {
    setupComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
  };
}

const StyledPage = styled.div`
  margin: 0 auto;
  /* Navbar spacing handled by global .navbar-visible class */
`;

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const DashboardHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const DashboardTitle = styled.h1`
  font-size: 3rem;
  font-family: "Marcellus", serif;
  font-weight: 400;
  color: #333;
  margin-bottom: 1rem;
`;

const DashboardSubtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  font-family: "Marcellus", serif;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color}20;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
`;

const StatTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

const StatSubtext = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const ProfileSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  margin-bottom: 3rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ProfileIcon = styled.div<{ complete: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.complete ? '#28a74520' : '#ffc10720'};
  color: ${props => props.complete ? '#28a745' : '#ffc107'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
`;

const ProfileTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ProfileStatus = styled.div<{ complete: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${props => props.complete ? '#28a74520' : '#ffc10720'};
  color: ${props => props.complete ? '#28a745' : '#ffc107'};
  margin-left: auto;
`;

const ProfileProgress = styled.div`
  margin-bottom: 1rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #96885f, #b8a67a);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: #666;
  text-align: center;
`;

const MissingFields = styled.div`
  margin-top: 1rem;
`;

const MissingField = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
`;

const ProfileInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ProfileField = styled.div`
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const ProfileLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProfileValue = styled.div`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
`;

const QRCodeSection = styled.div`
  text-align: center;
  padding: 12rem 2rem;
  background-color: #333;

  @media (max-width: 768px) {
    padding: 2.5rem 1rem;
  }
`;

const QRCodeContainer = styled.div`
  max-width: 420px;
  margin: 0 auto;
`;

const QRCodeTitle = styled.h2`
  font-size: 2.5rem;
  font-family: "Marcellus", serif;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0.025em;
  margin-bottom: 1.5rem;
  color: #fff;
  position: relative;
  display: inline-block;
  padding: 0 70px;

  &::before,
  &::after {
    content: "";
    display: block;
    width: 50px;
    height: 2px;
    background: #96885f;
    position: absolute;
    top: 50%;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  @media (max-width: 768px) {
    font-size: 1.8rem;
    padding: 0 40px;
    margin-bottom: 1rem;

    &::before,
    &::after {
      width: 30px;
    }
  }
`;

const QRCodeText = styled.p`
  font-size: 1.1rem;
  font-family: "Marcellus", serif;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #fff;

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
`;

const QRCodeWrapper = styled.div`
  display: inline-block;
  padding: 0.25rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 8px;
  }
`;

const AboutSection = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  position: relative;
  background-color: #f5f5f5;

  @media (max-width: 768px) {
    padding: 2.5rem 1rem;
  }
`;

const AboutContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const AboutTitle = styled.h2`
  font-size: 3rem;
  font-family: "Marcellus", serif;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0.025em;
  margin-bottom: 1.5rem;
  color: #333;
  position: relative;
  display: inline-block;
  padding: 0 70px;

  &::before,
  &::after {
    content: "";
    display: block;
    width: 50px;
    height: 2px;
    background: #96885f;
    position: absolute;
    top: 50%;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    padding: 0 40px;
    margin-bottom: 1rem;

    &::before,
    &::after {
      width: 30px;
    }
  }
`;

const AboutText = styled.p`
  font-size: 1.2rem;
  font-family: "Marcellus", serif;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #555;

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
`;

const MoreLink = styled.a`
  padding: 0.5rem 2rem;
  color: #333;
  background-color: transparent;
  border: 4px solid #96885f;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  display: inline-block;
  text-decoration: none;

  &:hover {
    background-color: rgba(150, 136, 95, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 1.5rem;
    font-size: 1rem;
    border-width: 3px;
  }
`;

export default function Panel() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <StyledPage>
        <Hero />
        
        <AboutSection>
          <AboutContainer>
            <AboutTitle>About the Artist</AboutTitle>
            <AboutText>
              Through tattooing, painting, and healing arts, Andrea Burg creates work as a living ceremony—an offering to nature, spirit, and the beauty that connects all beings. Her art is both a reflection of the Earth and an invitation to remember our own place within it.
            </AboutText>
            <MoreLink href="/about">More about the artist</MoreLink>
          </AboutContainer>
        </AboutSection>

        <QRCodeSection>
          <QRCodeContainer>
            <QRCodeTitle>Get In Touch</QRCodeTitle>
            <QRCodeText>
              For inquiries about commissions or available works.
            </QRCodeText>
            <QRCodeWrapper>
              <QRCodeSVG
                value={`https://burg-ink.vercel.app/inquire`}
                size={420}
                level="M"
                includeMargin={true}
              />
            </QRCodeWrapper>
          </QRCodeContainer>
        </QRCodeSection>
      </StyledPage>
    );
  }

  return (
    <StyledPage>
      <Hero />
      
      <DashboardContainer>
        <DashboardHeader>
          <DashboardTitle>Welcome back, {user?.name || 'User'}!</DashboardTitle>
          <DashboardSubtitle>Here&apos;s an overview of your portfolio and activity</DashboardSubtitle>
        </DashboardHeader>

        {loading && (
          <LoadingSpinner>
            Loading dashboard statistics...
          </LoadingSpinner>
        )}

        {error && (
          <ErrorMessage>
            Error loading dashboard: {error}
          </ErrorMessage>
        )}

        {stats && (
          <>
            {/* Profile Setup Status */}
            <ProfileSection>
              <ProfileHeader>
                <ProfileIcon complete={stats.profile.setupComplete}>
                  {stats.profile.setupComplete ? <FaCheckCircle /> : <FaExclamationCircle />}
                </ProfileIcon>
                <ProfileTitle>Profile Setup</ProfileTitle>
                <ProfileStatus complete={stats.profile.setupComplete}>
                  {stats.profile.setupComplete ? 'Complete' : `${stats.profile.completionPercentage}% Complete`}
                </ProfileStatus>
              </ProfileHeader>

              <ProfileProgress>
                <ProgressBar>
                  <ProgressFill percentage={stats.profile.completionPercentage} />
                </ProgressBar>
                <ProgressText>
                  {stats.profile.completionPercentage}% Complete
                </ProgressText>
              </ProfileProgress>

              {!stats.profile.setupComplete && (
                <MissingFields>
                  <h4>Missing Information:</h4>
                  {stats.profile.missingFields.map((field, index) => (
                    <MissingField key={index}>
                      <FaExclamationCircle style={{ marginRight: '0.5rem', color: '#ffc107' }} />
                      {field}
                    </MissingField>
                  ))}
                </MissingFields>
              )}

              {stats.profile.setupComplete && user && (
                <ProfileInfo>
                  <ProfileField>
                    <ProfileLabel>Name</ProfileLabel>
                    <ProfileValue>{user.name}</ProfileValue>
                  </ProfileField>
                  <ProfileField>
                    <ProfileLabel>Email</ProfileLabel>
                    <ProfileValue>{user.email}</ProfileValue>
                  </ProfileField>
                  <ProfileField>
                    <ProfileLabel>Bio</ProfileLabel>
                    <ProfileValue>{user.bio || 'No bio provided'}</ProfileValue>
                  </ProfileField>
                  <ProfileField>
                    <ProfileLabel>Role</ProfileLabel>
                    <ProfileValue>{user.role || 'User'}</ProfileValue>
                  </ProfileField>
                </ProfileInfo>
              )}
            </ProfileSection>

            {/* Statistics Grid */}
            <StatsGrid>
              <StatCard>
                <StatHeader>
                  <StatIcon color="#96885f">
                    <FaPalette />
                  </StatIcon>
                  <StatTitle>Artwork</StatTitle>
                </StatHeader>
                <StatValue>{stats.artwork.total}</StatValue>
                <StatSubtext>{stats.artwork.published} published</StatSubtext>
              </StatCard>

              <StatCard>
                <StatHeader>
                  <StatIcon color="#e91e63">
                    <FaTint />
                  </StatIcon>
                  <StatTitle>Tattoos</StatTitle>
                </StatHeader>
                <StatValue>{stats.tattoos.total}</StatValue>
                <StatSubtext>{stats.tattoos.published} published</StatSubtext>
              </StatCard>

              <StatCard>
                <StatHeader>
                  <StatIcon color="#17a2b8">
                    <FaImages />
                  </StatIcon>
                  <StatTitle>Media</StatTitle>
                </StatHeader>
                <StatValue>{stats.media.total}</StatValue>
                <StatSubtext>{stats.media.processed} processed</StatSubtext>
              </StatCard>

              <StatCard>
                <StatHeader>
                  <StatIcon color="#28a745">
                    <FaHandshake />
                  </StatIcon>
                  <StatTitle>Contracts</StatTitle>
                </StatHeader>
                <StatValue>{stats.contracts.total}</StatValue>
                <StatSubtext>{stats.contracts.active} active</StatSubtext>
              </StatCard>

              <StatCard>
                <StatHeader>
                  <StatIcon color="#ffc107">
                    <FaEnvelope />
                  </StatIcon>
                  <StatTitle>Inquiries</StatTitle>
                </StatHeader>
                <StatValue>{stats.inquiries.total}</StatValue>
                <StatSubtext>{stats.inquiries.new} new</StatSubtext>
              </StatCard>
            </StatsGrid>
          </>
        )}
      </DashboardContainer>

      <QRCodeSection>
        <QRCodeContainer>
          <QRCodeTitle>Get In Touch</QRCodeTitle>
          <QRCodeText>
            For inquiries about commissions or available works.
          </QRCodeText>
          <QRCodeWrapper>
            <QRCodeSVG
              value={`https://burg-ink.vercel.app/inquire`}
              size={420}
              level="M"
              includeMargin={true}
            />
          </QRCodeWrapper>
        </QRCodeContainer>
      </QRCodeSection>
    </StyledPage>
  );
}
