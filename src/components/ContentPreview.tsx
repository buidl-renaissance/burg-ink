import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaCode, FaFileAlt, FaImage, FaVideo, FaMusic, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

interface ContentPreviewProps {
  content: {
    id: string;
    type: 'text' | 'html' | 'image' | 'video' | 'audio' | 'file';
    title: string;
    content: string;
    url?: string;
    metadata?: {
      size?: string;
      duration?: string;
      dimensions?: string;
      format?: string;
    };
  };
  showPreview?: boolean;
  onTogglePreview?: (show: boolean) => void;
  className?: string;
}

const PreviewContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
`;

const PreviewTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
`;

const PreviewActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#3b82f6' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? '#2563eb' : '#4b5563'};
  }
`;

const ViewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
  }
`;

const PreviewContent = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'block' : 'none'};
  max-height: 400px;
  overflow-y: auto;
`;

const TextPreview = styled.div`
  padding: 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const HtmlPreview = styled.div`
  padding: 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: #374151;

  h1, h2, h3, h4, h5, h6 {
    margin: 1rem 0 0.5rem 0;
    font-weight: 600;
    color: #111827;
  }

  p {
    margin: 0.5rem 0;
  }

  ul, ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.25rem 0;
  }

  a {
    color: #3b82f6;
    text-decoration: underline;
  }

  code {
    background: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875em;
  }

  pre {
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
  }

  blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6b7280;
  }
`;

const MediaPreview = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f8f9fa;
`;

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 6px;
`;

const MediaVideo = styled.video`
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
`;

const MediaAudio = styled.audio`
  width: 100%;
  max-width: 400px;
`;

const MediaInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MediaMetadata = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
`;

const MediaActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FilePreview = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-size: 1.5rem;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const FileDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  gap: 1rem;
`;

const CodePreview = styled.div`
  padding: 1.5rem;
  background: #1f2937;
  color: #f9fafb;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
`;

const EmptyPreview = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const EmptySubtext = styled.div`
  font-size: 0.875rem;
  opacity: 0.7;
`;

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  showPreview = true,
  onTogglePreview,
  className
}) => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview);

  useEffect(() => {
    setIsPreviewVisible(showPreview);
  }, [showPreview]);

  const handleTogglePreview = () => {
    const newVisibility = !isPreviewVisible;
    setIsPreviewVisible(newVisibility);
    onTogglePreview?.(newVisibility);
  };

  const handleViewExternal = () => {
    if (content.url) {
      window.open(content.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (content.url) {
      const link = document.createElement('a');
      link.href = content.url;
      link.download = content.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getContentIcon = () => {
    switch (content.type) {
      case 'text':
        return <FaFileAlt />;
      case 'html':
        return <FaCode />;
      case 'image':
        return <FaImage />;
      case 'video':
        return <FaVideo />;
      case 'audio':
        return <FaMusic />;
      case 'file':
        return <FaFileAlt />;
      default:
        return <FaFileAlt />;
    }
  };

  const renderContent = () => {
    if (!content.content && !content.url) {
      return (
        <EmptyPreview>
          <EmptyIcon>{getContentIcon()}</EmptyIcon>
          <EmptyText>No content to preview</EmptyText>
          <EmptySubtext>This content item is empty or unavailable</EmptySubtext>
        </EmptyPreview>
      );
    }

    switch (content.type) {
      case 'text':
        return <TextPreview>{content.content}</TextPreview>;

      case 'html':
        return (
          <HtmlPreview 
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        );

      case 'image':
        return (
          <MediaPreview>
            <MediaImage 
              src={content.url || content.content} 
              alt={content.title}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {content.metadata && (
              <MediaInfo>
                <MediaMetadata>
                  {content.metadata.dimensions && (
                    <div>Dimensions: {content.metadata.dimensions}</div>
                  )}
                  {content.metadata.size && (
                    <div>Size: {content.metadata.size}</div>
                  )}
                  {content.metadata.format && (
                    <div>Format: {content.metadata.format}</div>
                  )}
                </MediaMetadata>
                <MediaActions>
                  {content.url && (
                    <>
                      <ViewButton onClick={handleViewExternal}>
                        <FaExternalLinkAlt />
                        View
                      </ViewButton>
                      <ViewButton onClick={handleDownload}>
                        <FaDownload />
                        Download
                      </ViewButton>
                    </>
                  )}
                </MediaActions>
              </MediaInfo>
            )}
          </MediaPreview>
        );

      case 'video':
        return (
          <MediaPreview>
            <MediaVideo 
              src={content.url || content.content} 
              controls
              preload="metadata"
            />
            {content.metadata && (
              <MediaInfo>
                <MediaMetadata>
                  {content.metadata.duration && (
                    <div>Duration: {content.metadata.duration}</div>
                  )}
                  {content.metadata.dimensions && (
                    <div>Resolution: {content.metadata.dimensions}</div>
                  )}
                  {content.metadata.format && (
                    <div>Format: {content.metadata.format}</div>
                  )}
                </MediaMetadata>
                <MediaActions>
                  {content.url && (
                    <ViewButton onClick={handleViewExternal}>
                      <FaExternalLinkAlt />
                      View
                    </ViewButton>
                  )}
                </MediaActions>
              </MediaInfo>
            )}
          </MediaPreview>
        );

      case 'audio':
        return (
          <MediaPreview>
            <MediaAudio 
              src={content.url || content.content} 
              controls
              preload="metadata"
            />
            {content.metadata && (
              <MediaInfo>
                <MediaMetadata>
                  {content.metadata.duration && (
                    <div>Duration: {content.metadata.duration}</div>
                  )}
                  {content.metadata.format && (
                    <div>Format: {content.metadata.format}</div>
                  )}
                  {content.metadata.size && (
                    <div>Size: {content.metadata.size}</div>
                  )}
                </MediaMetadata>
                <MediaActions>
                  {content.url && (
                    <ViewButton onClick={handleViewExternal}>
                      <FaExternalLinkAlt />
                      View
                    </ViewButton>
                  )}
                </MediaActions>
              </MediaInfo>
            )}
          </MediaPreview>
        );

      case 'file':
        return (
          <FilePreview>
            <FileIcon>{getContentIcon()}</FileIcon>
            <FileInfo>
              <FileName>{content.title}</FileName>
              <FileDetails>
                {content.metadata?.size && <span>Size: {content.metadata.size}</span>}
                {content.metadata?.format && <span>Type: {content.metadata.format}</span>}
              </FileDetails>
            </FileInfo>
            {content.url && (
              <MediaActions>
                <ViewButton onClick={handleViewExternal}>
                  <FaExternalLinkAlt />
                  Open
                </ViewButton>
                <ViewButton onClick={handleDownload}>
                  <FaDownload />
                  Download
                </ViewButton>
              </MediaActions>
            )}
          </FilePreview>
        );

      default:
        return <TextPreview>{content.content}</TextPreview>;
    }
  };

  return (
    <PreviewContainer className={className}>
      <PreviewHeader>
        <PreviewTitle>
          {getContentIcon()}
          {content.title}
        </PreviewTitle>
        <PreviewActions>
          <ToggleButton 
            active={isPreviewVisible} 
            onClick={handleTogglePreview}
          >
            {isPreviewVisible ? <FaEyeSlash /> : <FaEye />}
            {isPreviewVisible ? 'Hide' : 'Show'} Preview
          </ToggleButton>
          {content.url && (
            <ViewButton onClick={handleViewExternal}>
              <FaExternalLinkAlt />
              View External
            </ViewButton>
          )}
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent show={isPreviewVisible}>
        {renderContent()}
      </PreviewContent>
    </PreviewContainer>
  );
};

export default ContentPreview;
