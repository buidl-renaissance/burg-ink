import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaMinus, FaEdit, FaCode, FaEye, FaEyeSlash, FaCopy, FaCheck } from 'react-icons/fa';

interface DiffChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  content: string;
  line?: number;
  oldLine?: number;
  newLine?: number;
}

interface ContentDiff {
  content_id: string;
  old_value: string;
  new_value: string;
  file_path: string;
  line_number?: number;
  changes: DiffChange[];
}

interface ContentDiffViewerProps {
  diff: ContentDiff;
  showLineNumbers?: boolean;
  showInline?: boolean;
  maxHeight?: string;
  onCopy?: (text: string) => void;
  className?: string;
}

const DiffContainer = styled.div<{ maxHeight?: string }>`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  max-height: ${props => props.maxHeight || '500px'};
  display: flex;
  flex-direction: column;
`;

const DiffHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
`;

const DiffTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
`;

const DiffActions = styled.div`
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

const CopyButton = styled.button<{ copied?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.copied ? '#10b981' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.copied ? '#059669' : '#4b5563'};
  }
`;

const DiffContent = styled.div`
  flex: 1;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const DiffView = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'block' : 'none'};
`;

const SideBySideView = styled.div`
  display: flex;
  min-height: 200px;
`;

const SidePanel = styled.div<{ side: 'old' | 'new' }>`
  flex: 1;
  border-right: ${props => props.side === 'old' ? '1px solid #e5e7eb' : 'none'};
  background: ${props => props.side === 'old' ? '#fef2f2' : '#f0fdf4'};
`;

const SideHeader = styled.div<{ side: 'old' | 'new' }>`
  padding: 0.75rem 1rem;
  background: ${props => props.side === 'old' ? '#fecaca' : '#bbf7d0'};
  border-bottom: 1px solid ${props => props.side === 'old' ? '#fca5a5' : '#86efac'};
  font-weight: 600;
  color: ${props => props.side === 'old' ? '#dc2626' : '#16a34a'};
  font-size: 0.875rem;
`;

const SideContent = styled.div`
  padding: 0;
`;

const InlineView = styled.div`
  padding: 0;
`;

const DiffLine = styled.div<{ type: 'added' | 'removed' | 'modified' | 'unchanged'; showLineNumbers?: boolean }>`
  display: flex;
  align-items: flex-start;
  min-height: 1.5rem;
  background: ${props => {
    switch (props.type) {
      case 'added': return '#f0fdf4';
      case 'removed': return '#fef2f2';
      case 'modified': return '#fef3c7';
      default: return 'transparent';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'added': return '#10b981';
      case 'removed': return '#ef4444';
      case 'modified': return '#f59e0b';
      default: return 'transparent';
    }
  }};
  position: relative;

  &:hover {
    background: ${props => {
      switch (props.type) {
        case 'added': return '#dcfce7';
        case 'removed': return '#fee2e2';
        case 'modified': return '#fef3c7';
        default: return '#f8f9fa';
      }
    }};
  }
`;

const LineNumber = styled.div<{ side?: 'old' | 'new' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  padding: 0.25rem 0.5rem;
  background: ${props => props.side === 'old' ? '#fecaca' : props.side === 'new' ? '#bbf7d0' : '#f3f4f6'};
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  border-right: 1px solid #e5e7eb;
  user-select: none;
`;

const LineContent = styled.div`
  flex: 1;
  padding: 0.25rem 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
`;

const LineIcon = styled.div<{ type: 'added' | 'removed' | 'modified' | 'unchanged' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0.25rem 0.5rem;
  color: ${props => {
    switch (props.type) {
      case 'added': return '#10b981';
      case 'removed': return '#ef4444';
      case 'modified': return '#f59e0b';
      default: return '#9ca3af';
    }
  }};
  font-size: 0.75rem;
`;

const DiffStats = styled.div`
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
`;

const StatsItem = styled.div<{ type: 'added' | 'removed' | 'modified' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => {
    switch (props.type) {
      case 'added': return '#10b981';
      case 'removed': return '#ef4444';
      case 'modified': return '#f59e0b';
    }
  }};
`;

const EmptyDiff = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 2rem;
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

export const ContentDiffViewer: React.FC<ContentDiffViewerProps> = ({
  diff,
  showLineNumbers = true,
  showInline = false,
  maxHeight,
  onCopy,
  className
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (showInline) {
      setViewMode('inline');
    }
  }, [showInline]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getLineIcon = (type: string) => {
    switch (type) {
      case 'added': return <FaPlus />;
      case 'removed': return <FaMinus />;
      case 'modified': return <FaEdit />;
      default: return null;
    }
  };

  const getStats = () => {
    const added = diff.changes.filter(c => c.type === 'added').length;
    const removed = diff.changes.filter(c => c.type === 'removed').length;
    const modified = diff.changes.filter(c => c.type === 'modified').length;
    return { added, removed, modified };
  };

  const renderSideBySide = () => {
    const oldLines = diff.old_value.split('\n');
    const newLines = diff.new_value.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);

    return (
      <SideBySideView>
        <SidePanel side="old">
          <SideHeader side="old">Original</SideHeader>
          <SideContent>
            {oldLines.map((line, index) => (
              <DiffLine key={`old-${index}`} type="unchanged" showLineNumbers={showLineNumbers}>
                {showLineNumbers && <LineNumber side="old">{index + 1}</LineNumber>}
                <LineContent>{line}</LineContent>
              </DiffLine>
            ))}
          </SideContent>
        </SidePanel>
        <SidePanel side="new">
          <SideHeader side="new">Modified</SideHeader>
          <SideContent>
            {newLines.map((line, index) => (
              <DiffLine key={`new-${index}`} type="unchanged" showLineNumbers={showLineNumbers}>
                {showLineNumbers && <LineNumber side="new">{index + 1}</LineNumber>}
                <LineContent>{line}</LineContent>
              </DiffLine>
            ))}
          </SideContent>
        </SidePanel>
      </SideBySideView>
    );
  };

  const renderInline = () => {
    if (diff.changes.length === 0) {
      return (
        <EmptyDiff>
          <EmptyIcon><FaCode /></EmptyIcon>
          <EmptyText>No changes detected</EmptyText>
          <EmptySubtext>The content appears to be identical</EmptySubtext>
        </EmptyDiff>
      );
    }

    return (
      <InlineView>
        {diff.changes.map((change, index) => (
          <DiffLine key={index} type={change.type} showLineNumbers={showLineNumbers}>
            {showLineNumbers && (
              <>
                {change.oldLine && <LineNumber side="old">{change.oldLine}</LineNumber>}
                {change.newLine && <LineNumber side="new">{change.newLine}</LineNumber>}
              </>
            )}
            <LineIcon type={change.type}>{getLineIcon(change.type)}</LineIcon>
            <LineContent>{change.content}</LineContent>
          </DiffLine>
        ))}
      </InlineView>
    );
  };

  const stats = getStats();

  return (
    <DiffContainer maxHeight={maxHeight} className={className}>
      <DiffHeader>
        <DiffTitle>
          <FaCode />
          Content Diff: {diff.content_id}
        </DiffTitle>
        <DiffActions>
          <ToggleButton 
            active={viewMode === 'side-by-side'} 
            onClick={() => setViewMode('side-by-side')}
          >
            <FaEye />
            Side by Side
          </ToggleButton>
          <ToggleButton 
            active={viewMode === 'inline'} 
            onClick={() => setViewMode('inline')}
          >
            <FaCode />
            Inline
          </ToggleButton>
          <CopyButton 
            copied={copied}
            onClick={() => handleCopy(diff.new_value)}
          >
            {copied ? <FaCheck /> : <FaCopy />}
            {copied ? 'Copied!' : 'Copy New'}
          </CopyButton>
        </DiffActions>
      </DiffHeader>
      <DiffContent>
        <DiffView show={viewMode === 'side-by-side'}>
          {renderSideBySide()}
        </DiffView>
        <DiffView show={viewMode === 'inline'}>
          {renderInline()}
        </DiffView>
      </DiffContent>
      <DiffStats>
        <div>
          <strong>File:</strong> {diff.file_path}
          {diff.line_number && <span> (Line {diff.line_number})</span>}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {stats.added > 0 && (
            <StatsItem type="added">
              <FaPlus />
              {stats.added} added
            </StatsItem>
          )}
          {stats.removed > 0 && (
            <StatsItem type="removed">
              <FaMinus />
              {stats.removed} removed
            </StatsItem>
          )}
          {stats.modified > 0 && (
            <StatsItem type="modified">
              <FaEdit />
              {stats.modified} modified
            </StatsItem>
          )}
        </div>
      </DiffStats>
    </DiffContainer>
  );
};

export default ContentDiffViewer;
