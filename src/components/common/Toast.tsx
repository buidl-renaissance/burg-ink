import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfo, FaSpinner } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ type: ToastType; isRemoving: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'loading': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  animation: ${props => props.isRemoving ? slideOut : slideIn} 0.3s ease-in-out;
  overflow: hidden;
`;

const ToastContent = styled.div`
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ToastIcon = styled.div<{ type: ToastType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'loading': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  color: white;
  flex-shrink: 0;

  svg {
    font-size: 12px;
  }
`;

const ToastText = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ToastMessage = styled.div`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
`;

const ToastAction = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const ProgressBar = styled.div<{ duration: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #e5e7eb;
  width: 100%;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: #3b82f6;
    width: 100%;
    animation: progress ${props => props.duration}ms linear forwards;
  }

  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #6b7280;
  }
`;

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <FaCheck />;
    case 'error':
      return <FaTimes />;
    case 'warning':
      return <FaExclamationTriangle />;
    case 'info':
      return <FaInfo />;
    case 'loading':
      return <FaSpinner className="animate-spin" />;
    default:
      return <FaInfo />;
  }
};

export const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.type === 'loading') return; // Don't auto-remove loading toasts
    
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, toast.type, onRemove]);

  const handleClose = () => {
    onRemove(toast.id);
  };

  return (
    <ToastContainer type={toast.type} isRemoving={false}>
      <ToastContent>
        <ToastIcon type={toast.type}>
          {getIcon(toast.type)}
        </ToastIcon>
        <ToastText>
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
          {toast.action && (
            <ToastAction onClick={toast.action.onClick}>
              {toast.action.label}
            </ToastAction>
          )}
        </ToastText>
      </ToastContent>
      <CloseButton onClick={handleClose}>
        <FaTimes />
      </CloseButton>
      {toast.duration && toast.type !== 'loading' && (
        <ProgressBar duration={toast.duration} />
      )}
    </ToastContainer>
  );
};
