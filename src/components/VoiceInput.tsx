import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showConfidence?: boolean;
  autoSubmit?: boolean;
  confidenceThreshold?: number;
  className?: string;
}

const VoiceInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InputField = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const VoiceButton = styled.button<{ isListening: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: ${props => props.isListening ? '#ef4444' : '#96885f'};
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover:not(:disabled) {
    background: ${props => props.isListening ? '#dc2626' : '#7a6f4d'};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
  }
`;

const TTSButton = styled.button<{ isEnabled: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: ${props => props.isEnabled ? '#10b981' : '#6b7280'};
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover:not(:disabled) {
    background: ${props => props.isEnabled ? '#059669' : '#4b5563'};
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div<{ isListening: boolean }>`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.isListening ? '#ef4444' : '#10b981'};
  animation: ${props => props.isListening ? 'pulse 1.5s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

const ConfidenceBar = styled.div<{ confidence: number }>`
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    to right,
    #ef4444 0%,
    #f59e0b 50%,
    #10b981 100%
  );
  border-radius: 1px;
  transform: scaleX(${props => props.confidence});
  transform-origin: left;
  transition: transform 0.3s ease;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #dc2626;
  font-size: 0.875rem;
  z-index: 10;
`;

const TranscriptPreview = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  color: #0369a1;
  font-size: 0.875rem;
  z-index: 10;
`;

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  placeholder = "Type or speak your message...",
  disabled = false,
  showConfidence = true,
  autoSubmit = false,
  confidenceThreshold = 0.7,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [showTranscriptPreview, setShowTranscriptPreview] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage
  } = useVoiceInput({
    continuous: false,
    interimResults: true,
    confidenceThreshold
  });

  // Handle transcript updates
  useEffect(() => {
    if (transcript && transcript !== inputValue) {
      setInputValue(transcript);
      setShowTranscriptPreview(true);
      
      // Auto-submit if confidence is high enough
      if (autoSubmit && confidence >= confidenceThreshold) {
        setTimeout(() => {
          handleSubmit();
        }, 1000);
      }
    }
  }, [transcript, confidence, autoSubmit, confidenceThreshold, inputValue]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Text-to-speech functionality
  const speakText = (text: string) => {
    if (!isTTSEnabled || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onTranscript(inputValue.trim());
      setInputValue('');
      resetTranscript();
      setShowTranscriptPreview(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTTSToggle = () => {
    setIsTTSEnabled(!isTTSEnabled);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowTranscriptPreview(false);
  };

  if (!isSupported) {
    return (
      <VoiceInputContainer className={className}>
        <InputField
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
        />
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Voice input not supported
        </div>
      </VoiceInputContainer>
    );
  }

  return (
    <VoiceInputContainer className={className}>
      <div style={{ position: 'relative', flex: 1 }}>
        <InputField
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
        />
        {showConfidence && confidence > 0 && (
          <ConfidenceBar confidence={confidence} />
        )}
        {isListening && <StatusIndicator isListening={isListening} />}
      </div>

      <VoiceButton
        onClick={handleVoiceToggle}
        isListening={isListening}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
      </VoiceButton>

      <TTSButton
        onClick={handleTTSToggle}
        isEnabled={isTTSEnabled}
        disabled={disabled}
        title={isTTSEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
      >
        {isTTSEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
      </TTSButton>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {showTranscriptPreview && transcript && (
        <TranscriptPreview>
          <strong>Voice input:</strong> {transcript}
          {confidence > 0 && (
            <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
              ({Math.round(confidence * 100)}% confidence)
            </span>
          )}
        </TranscriptPreview>
      )}
    </VoiceInputContainer>
  );
};

export default VoiceInput;
