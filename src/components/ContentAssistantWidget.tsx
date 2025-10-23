import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaComments, FaMicrophone, FaMicrophoneSlash, FaTimes, FaChevronUp, FaChevronDown, FaBolt, FaHistory, FaCog } from 'react-icons/fa';
import VoiceInput from './VoiceInput';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './common/ToastContainer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ContentSuggestion {
  id?: number;
  content_type: string;
  target_id?: number;
  target_path?: string;
  field_name?: string;
  current_value?: string;
  suggested_value: string;
  change_type: 'create' | 'update' | 'delete';
  reasoning: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

interface ContentAssistantWidgetProps {
  className?: string;
}

const WidgetContainer = styled.div<{ isExpanded: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  transition: all 0.3s ease;
  transform: ${props => props.isExpanded ? 'translateY(0)' : 'translateY(0)'};
`;

const WidgetButton = styled.button<{ isExpanded: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.isExpanded ? '#ef4444' : '#96885f'};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const WidgetPanel = styled.div<{ isExpanded: boolean }>`
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 400px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transform: ${props => props.isExpanded ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)'};
  opacity: ${props => props.isExpanded ? 1 : 0};
  transition: all 0.3s ease;
  pointer-events: ${props => props.isExpanded ? 'auto' : 'none'};

  @media (max-width: 480px) {
    width: calc(100vw - 40px);
    right: -20px;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
`;

const PanelTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
`;

const PanelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const PanelContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 400px;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 250px;
`;

const MessageBubble = styled.div<{ type: 'user' | 'assistant' }>`
  display: flex;
  flex-direction: column;
  max-width: 85%;
  align-self: ${props => props.type === 'user' ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div<{ type: 'user' | 'assistant' }>`
  background: ${props => props.type === 'user' ? '#96885f' : '#f3f4f6'};
  color: ${props => props.type === 'user' ? 'white' : '#374151'};
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MessageTime = styled.div<{ type: 'user' | 'assistant' }>`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
  align-self: ${props => props.type === 'user' ? 'flex-end' : 'flex-start'};
`;

const InputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
`;

const InputField = styled.textarea`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  resize: none;
  min-height: 40px;
  max-height: 100px;
  font-family: inherit;
  margin-bottom: 0.75rem;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const InputActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.disabled ? '#d1d5db' : '#96885f'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #7a6f4d;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const VoiceButton = styled.button<{ isListening: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.isListening ? '#ef4444' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isListening ? '#dc2626' : '#4b5563'};
  }
`;

const SuggestionsContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f8f9fa;
  max-height: 150px;
  overflow-y: auto;
`;

const SuggestionsTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const SuggestionItem = styled.div`
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #96885f;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SuggestionType = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #96885f;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const SuggestionText = styled.div`
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e5e7eb;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #96885f;
    color: #374151;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem 1rem;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #96885f;
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }

  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

export const ContentAssistantWidget: React.FC<ContentAssistantWidgetProps> = ({
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [currentContext, setCurrentContext] = useState<any>(null);
  
  const { toasts, success, error, warning, removeToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current page context
  useEffect(() => {
    const getCurrentContext = () => {
      const path = window.location.pathname;
      const context = {
        currentPage: path,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      setCurrentContext(context);
    };

    getCurrentContext();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: inputValue,
          context: currentContext
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update suggestions if provided
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(prev => [...prev, ...data.suggestions]);
      }

    } catch (error) {
      console.error('Error calling content assistant API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript);
  };

  const handleVoiceError = (error: string) => {
    warning({
      title: 'Voice Input Error',
      message: error
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: ContentSuggestion) => {
    const message = `Apply suggestion: ${suggestion.reasoning}`;
    setInputValue(message);
  };

  const handleQuickAction = (action: string) => {
    const messages = {
      'create-artwork': 'Create a new artwork',
      'create-tattoo': 'Create a new tattoo design',
      'create-event': 'Create a new event',
      'update-content': 'Update content on this page',
      'scan-hardcoded': 'Scan for hardcoded content'
    };

    setInputValue(messages[action as keyof typeof messages] || action);
  };

  const quickActions = [
    { id: 'create-artwork', label: 'New Artwork', icon: <FaBolt /> },
    { id: 'create-tattoo', label: 'New Tattoo', icon: <FaBolt /> },
    { id: 'create-event', label: 'New Event', icon: <FaBolt /> },
    { id: 'update-content', label: 'Update Content', icon: <FaCog /> },
    { id: 'scan-hardcoded', label: 'Scan Content', icon: <FaHistory /> }
  ];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <WidgetContainer isExpanded={isExpanded} className={className}>
        <WidgetButton 
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Close Content Assistant' : 'Open Content Assistant'}
        >
          {isExpanded ? <FaTimes /> : <FaComments />}
        </WidgetButton>

        <WidgetPanel isExpanded={isExpanded}>
          <PanelHeader>
            <PanelTitle>
              <FaComments />
              Content Assistant
            </PanelTitle>
            <PanelActions>
              <CloseButton onClick={() => setIsExpanded(false)}>
                <FaTimes />
              </CloseButton>
            </PanelActions>
          </PanelHeader>

          <PanelContent>
            <ChatContainer>
              <MessagesContainer>
                {messages.length === 0 ? (
                  <div style={{ 
                    padding: '2rem 1rem', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    <FaComments style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                    <div>Hi! I'm your content assistant.</div>
                    <div>How can I help you manage your content?</div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble key={message.id} type={message.type}>
                      <MessageContent type={message.type}>{message.content}</MessageContent>
                      <MessageTime type={message.type}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </MessageTime>
                    </MessageBubble>
                  ))
                )}
                {isLoading && (
                  <MessageBubble type="assistant">
                    <TypingIndicator>
                      <span></span>
                      <span></span>
                      <span></span>
                    </TypingIndicator>
                  </MessageBubble>
                )}
                <div ref={messagesEndRef} />
              </MessagesContainer>

              <InputContainer>
                <InputField
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type or speak your content management command..."
                  disabled={isLoading}
                />
                <InputActions>
                  <VoiceInput
                    onTranscript={handleVoiceTranscript}
                    onError={handleVoiceError}
                    placeholder=""
                    autoSubmit={false}
                    confidenceThreshold={0.7}
                  />
                  <SendButton 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !inputValue.trim()}
                  >
                    Send
                  </SendButton>
                </InputActions>
              </InputContainer>
            </ChatContainer>

            {suggestions.length > 0 && (
              <SuggestionsContainer>
                <SuggestionsTitle>Recent Suggestions</SuggestionsTitle>
                {suggestions.slice(-3).map((suggestion, index) => (
                  <SuggestionItem 
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <SuggestionType>{suggestion.content_type}</SuggestionType>
                    <SuggestionText>{suggestion.reasoning}</SuggestionText>
                  </SuggestionItem>
                ))}
              </SuggestionsContainer>
            )}

            <QuickActions>
              {quickActions.map((action) => (
                <QuickActionButton 
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  title={action.label}
                >
                  {action.icon}
                  {action.label}
                </QuickActionButton>
              ))}
            </QuickActions>
          </PanelContent>
        </WidgetPanel>
      </WidgetContainer>
    </>
  );
};

export default ContentAssistantWidget;
