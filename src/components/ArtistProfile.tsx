import { Artist } from '@/utils/interfaces';
import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';

interface ArtistProfileProps {
  artist: Artist;
}

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
`;

const ProfileImage = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 2px solid #444;
  position: relative;
  
  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const ArtistName = styled.h2`
  font-size: 1.5rem;
  margin: 0.5rem 0;
  color: #333;
`;

const ArtistBio = styled.p`
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  line-height: 1.5;
  margin-top: 0.5rem;
`;

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ artist }) => {
  return (
    <ProfileContainer className="artist-profile">
      {artist.profile_picture && (
        <ProfileImage>
          <Image 
            src={artist.profile_picture} 
            alt={artist.name}
            fill
            style={{ objectFit: 'cover' }}
          />
        </ProfileImage>
      )}
      <ArtistName>{artist.name}</ArtistName>
      <ArtistBio>{artist.bio}</ArtistBio>
    </ProfileContainer>
  );
};
