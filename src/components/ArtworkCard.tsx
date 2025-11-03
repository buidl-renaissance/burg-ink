import styled from "styled-components";
import { Artwork } from "@/utils/interfaces";
// import { convertDefaultToResized } from '@/utils/image';
import Image from "next/image";

const ArtworkContainer = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 100%; /* Changed from 75% to 100% for square aspect ratio */
    overflow: hidden;
  }

  .image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &:hover .image,
  &:hover .video {
    transform: scale(1.05);
  }
`;

interface ArtworkCardProps {
  artwork: Artwork;
}

export const ArtworkCard = ({ artwork }: ArtworkCardProps) => {
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) || 
           url.includes('video/') || 
           url.includes('blob:') && url.includes('video');
  };

  return (
    <ArtworkContainer>
      <div className="image-container">
        {artwork.image && (
          isVideo(artwork.image) ? (
            <video
              className="video"
              src={artwork.image}
              muted
              loop
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              alt={artwork.title}
              className="image"
              src={artwork.image}
              fill
              style={{ objectFit: "cover" }}
            />
          )
        )}
      </div>
    </ArtworkContainer>
  );
};

export default ArtworkCard;
