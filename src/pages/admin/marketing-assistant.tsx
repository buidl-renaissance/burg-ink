'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaComments, FaLightbulb, FaDownload, FaShare, FaUser, FaPalette, FaBullseye, FaChartLine } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { MarketingMessage, ArtistProfile, MarketingResponse } from '@/lib/ai';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }, { label: 'Marketing Assistant', href: '/admin/marketing-assistant' }],
      currentPage: 'marketing-assistant'
    }
  }
};

export default function MarketingAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI marketing assistant. I'm here to help you understand your artistic identity and create effective marketing strategies. Let's start by getting to know you and your work better. What's your name?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artistProfile, setArtistProfile] = useState<Partial<ArtistProfile>>({});
  const [conversationStage, setConversationStage] = useState<'intro' | 'style' | 'audience' | 'goals' | 'summary' | 'complete'>('intro');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = async (userInput: string): Promise<string> => {
    try {
      // Convert messages to the format expected by the API
      const conversationHistory: MarketingMessage[] = messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
          role: msg.type,
          content: msg.content
        }));

      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory,
          currentProfile: artistProfile,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: MarketingResponse = await response.json();
      
      // Update profile if new information is provided
      if (data.profile) {
        setArtistProfile(prev => ({ ...prev, ...data.profile }));
      }

      // Update conversation stage
      if (data.stage) {
        setConversationStage(data.stage);
      }

      return data.message;
    } catch (error) {
      console.error('Error calling marketing assistant API:', error);
      throw new Error('Failed to get response from marketing assistant');
    }
  };

  const generateMarketingSummary = async (): Promise<string> => {
    try {
      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-summary',
          currentProfile: artistProfile,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: MarketingResponse = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error generating marketing summary:', error);
      throw new Error('Failed to generate marketing summary');
    }
  };

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
      let response: string;
      
      // If we have a complete profile and user asks for summary, generate it
      if (conversationStage === 'summary' && 
          artistProfile.name && 
          artistProfile.medium && 
          artistProfile.style && 
          artistProfile.targetAudience && 
          artistProfile.goals) {
        response = await generateMarketingSummary();
        setConversationStage('complete');
      } else {
        response = await generateResponse(inputValue);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetConversation = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI marketing assistant. I'm here to help you understand your artistic identity and create effective marketing strategies. Let's start by getting to know you and your work better. What's your name?",
      timestamp: new Date()
    }]);
    setArtistProfile({});
    setConversationStage('intro');
  };

  return (
    <AdminLayout currentPage="marketing-assistant">
      <Container>
        <Header>
          <Title>
            <FaLightbulb />
            Marketing Assistant
          </Title>
          <Subtitle>AI-powered marketing guidance for artists</Subtitle>
        </Header>

        <Content>
          <ChatSection>
            <ChatHeader>
              <ChatTitle>Artist Marketing Chat</ChatTitle>
              <ResetButton onClick={resetConversation}>
                <FaShare /> New Conversation
              </ResetButton>
            </ChatHeader>

            <MessagesContainer>
              {messages.map((message) => (
                <MessageBubble key={message.id} type={message.type}>
                  <MessageContent type={message.type}>{message.content}</MessageContent>
                  <MessageTime type={message.type}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </MessageTime>
                </MessageBubble>
              ))}
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

            <InputSection>
              <InputContainer>
                <ChatInput
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <SendButton onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                  <FaComments />
                </SendButton>
              </InputContainer>
            </InputSection>
          </ChatSection>

          <Sidebar>
            <SidebarSection>
              <SidebarTitle>
                <FaUser />
                Artist Profile
              </SidebarTitle>
              {artistProfile.name && (
                <ProfileCard>
                  <ProfileItem>
                    <strong>Name:</strong> {artistProfile.name}
                  </ProfileItem>
                  {artistProfile.medium && (
                    <ProfileItem>
                      <strong>Medium:</strong> {artistProfile.medium}
                    </ProfileItem>
                  )}
                  {artistProfile.style && (
                    <ProfileItem>
                      <strong>Style:</strong> {artistProfile.style}
                    </ProfileItem>
                  )}
                  {artistProfile.targetAudience && (
                    <ProfileItem>
                      <strong>Target Audience:</strong> {artistProfile.targetAudience}
                    </ProfileItem>
                  )}
                  {artistProfile.goals && (
                    <ProfileItem>
                      <strong>Goals:</strong> {artistProfile.goals}
                    </ProfileItem>
                  )}
                </ProfileCard>
              )}
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>
                <FaBullseye />
                Quick Actions
              </SidebarTitle>
              <ActionButtons>
                <ActionButton>
                  <FaDownload />
                  Export Profile
                </ActionButton>
                <ActionButton>
                  <FaChartLine />
                  Marketing Plan
                </ActionButton>
                <ActionButton>
                  <FaPalette />
                  Content Ideas
                </ActionButton>
              </ActionButtons>
            </SidebarSection>
          </Sidebar>
        </Content>
      </Container>
    </AdminLayout>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  height: calc(100vh - 200px);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const ChatSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ChatTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #96885f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #7a6f4d;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const MessageBubble = styled.div<{ type: 'user' | 'assistant' }>`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  align-self: ${props => props.type === 'user' ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div<{ type: 'user' | 'assistant' }>`
  background: ${props => props.type === 'user' ? '#96885f' : '#f8f9fa'};
  color: ${props => props.type === 'user' ? 'white' : '#333'};
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-wrap;

  @media (max-width: 768px) {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
`;

const MessageTime = styled.div<{ type: 'user' | 'assistant' }>`
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
  align-self: ${props => props.type === 'user' ? 'flex-end' : 'flex-start'};
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 1rem;

  span {
    width: 8px;
    height: 8px;
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

const InputSection = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background: white;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
`;

const ChatInput = styled.textarea`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #96885f;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;

  &:hover:not(:disabled) {
    background: #7a6f4d;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    order: -1;
  }
`;

const SidebarSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SidebarTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
`;

const ProfileCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
`;

const ProfileItem = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e9ecef;
    border-color: #96885f;
  }
`; 