'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaComments, FaLightbulb, FaDownload, FaShare, FaPalette, FaChartLine, FaCopy, FaTimes, FaCheck, FaTrash, FaSpinner, FaBolt, FaShareAlt, FaUser, FaLock } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { MarketingMessage, ArtistProfile, MarketingResponse } from '@/lib/ai';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedContent {
  content: string;
  hashtags: string[];
  platform: string;
  tone: string;
  characterCount: number;
  metadata: {
    ctas: string[];
    mentions: string[];
    keywords: string[];
    estimatedEngagement: string;
  };
  variations?: string[];
}

interface ContentGenerationState {
  isGenerating: boolean;
  generatedContent: GeneratedContent | null;
  showContentPanel: boolean;
  contentType: 'social-post' | 'caption' | 'hashtags' | 'bio' | 'artist-statement' | 'email';
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'email';
  tone: 'professional' | 'casual' | 'hype' | 'minimal' | 'storytelling' | 'educational';
  copiedToClipboard: boolean;
}

interface ConversationThread {
  id: number;
  title: string;
  messages: Message[];
  artistProfile: Partial<ArtistProfile>;
  conversationStage: string;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

interface ConversationState {
  currentConversationId: number | null;
  conversations: ConversationThread[];
  isLoadingConversations: boolean;
}

interface OnboardingState {
  profile_created: boolean;
  goals_set: boolean;
  preferences_configured: boolean;
  onboarding_complete: boolean;
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
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Helper function to check onboarding requirements
  const checkOnboardingRequirement = (actionName: string, requiresComplete: boolean = false) => {
    const completionPercentage = Object.values(onboardingState).filter(Boolean).length / 4 * 100;
    
    if (requiresComplete && !onboardingState.onboarding_complete) {
      warning({
        title: `Complete your profile to use ${actionName}`,
        message: `Your profile is ${Math.round(completionPercentage)}% complete. Finish setup to unlock this feature.`,
        action: {
          label: 'Complete Profile',
          onClick: () => {
            // Focus on the chat input to encourage completion
            const chatInput = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
            if (chatInput) {
              chatInput.focus();
            }
          }
        }
      });
      return false;
    }
    
    if (!onboardingState.profile_created) {
      warning({
        title: `Create your profile first`,
        message: `Start by telling the assistant your name and artistic medium.`,
        action: {
          label: 'Start Profile',
          onClick: () => {
            const chatInput = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
            if (chatInput) {
              chatInput.focus();
            }
          }
        }
      });
      return false;
    }
    
    return true;
  };

  // Content generation state
  const [contentState, setContentState] = useState<ContentGenerationState>({
    isGenerating: false,
    generatedContent: null,
    showContentPanel: false,
    contentType: 'social-post',
    platform: 'instagram',
    tone: 'professional',
    copiedToClipboard: false
  });

  // Conversation state
  const [conversationState, setConversationState] = useState<ConversationState>({
    currentConversationId: null,
    conversations: [],
    isLoadingConversations: false
  });

  // Onboarding state
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    profile_created: false,
    goals_set: false,
    preferences_configured: false,
    onboarding_complete: false
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and initial message on mount
  useEffect(() => {
    loadConversations();
    loadInitialMessage();
  }, []);

  const loadInitialMessage = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant/initial-message', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingState(data.onboardingState);
        setArtistProfile(data.currentProfile);
        
        // Update the initial message if we have onboarding state
        if (data.message && data.message !== messages[0]?.content) {
          setMessages([{
            id: '1',
            type: 'assistant',
            content: data.message,
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading initial message:', error);
    }
  };

  const generateResponse = async (userInput: string): Promise<string> => {
    try {
      // Convert messages to the format expected by the API
      const conversationHistory: MarketingMessage[] = messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
          role: msg.type,
          content: msg.content
        }));

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory,
          currentProfile: artistProfile,
          conversationId: conversationState.currentConversationId,
          saveConversation: true
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

      // Update onboarding state
      if (data.onboardingState) {
        setOnboardingState(data.onboardingState);
      }

      return data.message;
    } catch (error) {
      console.error('Error calling marketing assistant API:', error);
      throw new Error('Failed to get response from marketing assistant');
    }
  };

  const generateMarketingSummary = async (): Promise<string> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // Content generation functions
  const generateContent = async () => {
    if (!artistProfile.name) {
      alert('Please complete your artist profile first by chatting with the assistant.');
      return;
    }

    setContentState(prev => ({ ...prev, isGenerating: true }));

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          action: `generate-${contentState.contentType}`,
          contentType: contentState.contentType,
          platform: contentState.platform,
          tone: contentState.tone,
          currentProfile: {
            ...artistProfile,
            artistId: 1 // This should be the actual artist ID
          },
          additionalContext: inputValue
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.generatedContent) {
        setContentState(prev => ({
          ...prev,
          generatedContent: data.generatedContent,
          isGenerating: false
        }));
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }

    } catch (error) {
      console.error('Error generating content:', error);
      setContentState(prev => ({ ...prev, isGenerating: false }));
      alert('Failed to generate content. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setContentState(prev => ({ ...prev, copiedToClipboard: true }));
      setTimeout(() => {
        setContentState(prev => ({ ...prev, copiedToClipboard: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openContentPanel = () => {
    if (!checkOnboardingRequirement('Generate Content', false)) {
      return;
    }
    setContentState(prev => ({ ...prev, showContentPanel: true }));
  };

  const closeContentPanel = () => {
    setContentState(prev => ({ ...prev, showContentPanel: false, generatedContent: null }));
  };

  // Conversation management functions
  const loadConversations = async () => {
    setConversationState(prev => ({ ...prev, isLoadingConversations: true }));
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant/conversations', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure dates are properly converted
        const conversationsWithDates = data.conversations.map((conv: ConversationThread) => ({
          ...conv,
          lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date(),
          createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
          updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : new Date()
        }));
        setConversationState(prev => ({
          ...prev,
          conversations: conversationsWithDates,
          isLoadingConversations: false
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversationState(prev => ({ ...prev, isLoadingConversations: false }));
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const conversation = conversationState.conversations.find(c => c.id === conversationId);
      if (conversation) {
        // Load the conversation and ensure timestamps are Date objects
        const messagesWithDates = conversation.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        setArtistProfile(conversation.artistProfile);
        setConversationStage(conversation.conversationStage as 'intro' | 'summary' | 'complete');
        setConversationState(prev => ({
          ...prev,
          currentConversationId: conversationId
        }));
        
        // Mark as active
        const token = localStorage.getItem('authToken');
        await fetch('/api/marketing-assistant/conversations', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({
            id: conversationId,
            isActive: true
          })
        });
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI marketing assistant. I'm here to help you understand your artistic identity and create effective marketing strategies. Let's start by getting to know you and your work better. What's your name?",
      timestamp: new Date()
    }]);
    setArtistProfile({});
    setConversationStage('intro');
    setConversationState(prev => ({
      ...prev,
      currentConversationId: null
    }));
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/marketing-assistant/conversations?id=${conversationId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        setConversationState(prev => ({
          ...prev,
          conversations: prev.conversations.filter(c => c.id !== conversationId)
        }));
        
        // If we deleted the current conversation, start a new one
        if (conversationState.currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };


  // Quick action handlers
  const handleExportProfile = async () => {
    if (!checkOnboardingRequirement('Export Profile', true)) {
      return;
    }

    loading({
      title: 'Exporting profile...',
      message: 'Preparing your artist profile for download'
    });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant/export-profile?artistId=1', {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artist-profile-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success({
        title: 'Profile exported successfully!',
        message: 'Your artist profile has been downloaded'
      });

    } catch (err) {
      console.error('Error exporting profile:', err);
      error({
        title: 'Export failed',
        message: 'Failed to export profile. Please try again.',
        action: {
          label: 'Retry',
          onClick: handleExportProfile
        }
      });
    }
  };

  const handleMarketingPlan = async () => {
    if (!checkOnboardingRequirement('Marketing Plan', true)) {
      return;
    }

    loading({
      title: 'Generating marketing plan...',
      message: 'Creating your personalized marketing strategy'
    });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/marketing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          action: 'generate-summary',
          currentProfile: artistProfile
        }),
      });

      if (!response.ok) {
        throw new Error(`Marketing plan generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Display the marketing plan in a modal or alert
      const planWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      if (planWindow) {
        planWindow.document.write(`
          <html>
            <head>
              <title>Marketing Plan - ${artistProfile.name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #96885f; padding-bottom: 10px; }
                h2 { color: #555; margin-top: 30px; }
                .recommendation { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #96885f; }
                .timestamp { color: #666; font-size: 0.9em; }
              </style>
            </head>
            <body>
              <h1>Marketing Plan for ${artistProfile.name}</h1>
              <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
              <div>${data.message.replace(/\n/g, '<br>')}</div>
              ${data.recommendations ? `
                <h2>Key Recommendations</h2>
                ${data.recommendations.map((rec: string) => `<div class="recommendation">${rec}</div>`).join('')}
              ` : ''}
            </body>
          </html>
        `);
        planWindow.document.close();
        
        success({
          title: 'Marketing plan generated!',
          message: 'Your personalized marketing strategy is ready'
        });
      } else {
        warning({
          title: 'Popup blocked',
          message: 'Please allow popups to view your marketing plan.',
          action: {
            label: 'Try Again',
            onClick: handleMarketingPlan
          }
        });
      }

    } catch (err) {
      console.error('Error generating marketing plan:', err);
      error({
        title: 'Marketing plan failed',
        message: 'Failed to generate marketing plan. Please try again.',
        action: {
          label: 'Retry',
          onClick: handleMarketingPlan
        }
      });
    }
  };

  return (
    <AdminLayout currentPage="marketing-assistant">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Container>
        <Header>
          <Title>
            <FaLightbulb />
            Marketing Assistant
          </Title>
          <Subtitle>AI-powered marketing guidance for artists</Subtitle>
        </Header>

        <Content>
          <MainContent>
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
                      {(() => {
                        try {
                          const date = new Date(message.timestamp);
                          return isNaN(date.getTime()) ? 'Invalid time' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } catch (error) {
                          console.error('Error parsing message timestamp:', error);
                          return 'Invalid time';
                        }
                      })()}
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
          </MainContent>

          <RightSidebar>
            <SidebarSection>
              <SidebarTitle>
                <FaComments />
                Conversations
              </SidebarTitle>
              
              <ConversationList>
                {conversationState.isLoadingConversations ? (
                  <ConversationLoading>Loading conversations...</ConversationLoading>
                ) : conversationState.conversations.length === 0 ? (
                  <ConversationEmpty>No previous conversations</ConversationEmpty>
                ) : (
                  conversationState.conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      active={conversationState.currentConversationId === conversation.id}
                      onClick={() => loadConversation(conversation.id)}
                    >
                      <ConversationTitle>{conversation.title}</ConversationTitle>
                      <ConversationMeta>
                        {(() => {
                          try {
                            const date = new Date(conversation.lastMessageAt || conversation.createdAt || conversation.updatedAt);
                            if (isNaN(date.getTime())) {
                              return 'No date';
                            }
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - date.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays === 1) {
                              return 'Today';
                            } else if (diffDays === 2) {
                              return 'Yesterday';
                            } else if (diffDays <= 7) {
                              return `${diffDays - 1} days ago`;
                            } else {
                              return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                              });
                            }
                          } catch (error) {
                            console.error('Error parsing conversation timestamp:', error);
                            return 'No date';
                          }
                        })()}
                        {conversation.isActive && <ActiveIndicator>Active</ActiveIndicator>}
                      </ConversationMeta>
                      <ConversationActions>
                        <ConversationActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                        >
                          <FaTrash />
                        </ConversationActionButton>
                      </ConversationActions>
                    </ConversationItem>
                  ))
                )}
              </ConversationList>
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>
                <FaUser />
                Profile Progress
              </SidebarTitle>
              
              <ProfileProgressContainer>
                <ProfileProgressBar>
                  <ProfileProgressFill 
                    width={(() => {
                      const completed = Object.values(onboardingState).filter(Boolean).length;
                      const total = Object.keys(onboardingState).length;
                      return (completed / total) * 100;
                    })()}
                  />
                </ProfileProgressBar>
                <ProfileProgressText>
                  {(() => {
                    const completed = Object.values(onboardingState).filter(Boolean).length;
                    const total = Object.keys(onboardingState).length;
                    return `${Math.round((completed / total) * 100)}% Complete`;
                  })()}
                </ProfileProgressText>
                
                <ProfileProgressSteps>
                  <ProfileStep completed={onboardingState.profile_created}>
                    <FaCheck />
                    Basic Profile
                  </ProfileStep>
                  <ProfileStep completed={onboardingState.goals_set}>
                    <FaCheck />
                    Goals & Audience
                  </ProfileStep>
                  <ProfileStep completed={onboardingState.preferences_configured}>
                    <FaCheck />
                    Preferences
                  </ProfileStep>
                  <ProfileStep completed={onboardingState.onboarding_complete}>
                    <FaCheck />
                    Complete
                  </ProfileStep>
                </ProfileProgressSteps>
              </ProfileProgressContainer>
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>
                <FaBolt />
                Quick Actions
              </SidebarTitle>
              
              <QuickActionsList>
                <QuickActionButton 
                  onClick={handleExportProfile}
                  disabled={!onboardingState.onboarding_complete}
                  title={!onboardingState.onboarding_complete ? "Complete your profile first" : ""}
                >
                  <FaDownload />
                  Export Profile
                  {!onboardingState.onboarding_complete && <FaLock style={{marginLeft: 'auto', opacity: 0.5}} />}
                </QuickActionButton>
                
                <QuickActionButton 
                  onClick={handleMarketingPlan}
                  disabled={!onboardingState.onboarding_complete}
                  title={!onboardingState.onboarding_complete ? "Complete your profile first" : ""}
                >
                  <FaChartLine />
                  Marketing Plan
                  {!onboardingState.onboarding_complete && <FaLock style={{marginLeft: 'auto', opacity: 0.5}} />}
                </QuickActionButton>
                
                <QuickActionButton 
                  onClick={openContentPanel}
                  disabled={!onboardingState.profile_created}
                  title={!onboardingState.profile_created ? "Create your profile first" : ""}
                >
                  <FaPalette />
                  Generate Content
                  {!onboardingState.profile_created && <FaLock style={{marginLeft: 'auto', opacity: 0.5}} />}
                </QuickActionButton>
                
                <QuickActionButton onClick={openContentPanel}>
                  <FaShareAlt />
                  Social Media
                </QuickActionButton>
              </QuickActionsList>
            </SidebarSection>
          </RightSidebar>
        </Content>

        {/* Content Generation Panel */}
        {contentState.showContentPanel && (
          <ContentPanelOverlay>
            <ContentPanel>
              <ContentPanelHeader>
                <ContentPanelTitle>
                  <FaPalette />
                  Content Generator
                </ContentPanelTitle>
                <CloseButton onClick={closeContentPanel}>
                  <FaTimes />
                </CloseButton>
              </ContentPanelHeader>

              <ContentPanelBody>
                {!contentState.generatedContent ? (
                  <ContentForm>
                    <FormGroup>
                      <Label>Content Type</Label>
                      <Select
                        value={contentState.contentType}
                        onChange={(e) => setContentState(prev => ({ 
                          ...prev, 
                          contentType: e.target.value as 'social-post' | 'caption' | 'hashtags' | 'bio' | 'artist-statement' | 'email'
                        }))}
                      >
                        <option value="social-post">Social Media Post</option>
                        <option value="caption">Caption Only</option>
                        <option value="hashtags">Hashtags</option>
                        <option value="bio">Artist Bio</option>
                        <option value="artist-statement">Artist Statement</option>
                        <option value="email">Email Template</option>
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Platform</Label>
                      <Select
                        value={contentState.platform}
                        onChange={(e) => setContentState(prev => ({ 
                          ...prev, 
                          platform: e.target.value as 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'email'
                        }))}
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter</option>
                        <option value="tiktok">TikTok</option>
                        <option value="email">Email</option>
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Tone</Label>
                      <Select
                        value={contentState.tone}
                        onChange={(e) => setContentState(prev => ({ 
                          ...prev, 
                          tone: e.target.value as 'professional' | 'casual' | 'hype' | 'minimal' | 'storytelling' | 'educational'
                        }))}
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="hype">Hype</option>
                        <option value="minimal">Minimal</option>
                        <option value="storytelling">Storytelling</option>
                        <option value="educational">Educational</option>
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Additional Context (Optional)</Label>
                      <TextArea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add any specific details about the content you want to create..."
                        rows={3}
                      />
                    </FormGroup>

                    <GenerateButton 
                      onClick={generateContent} 
                      disabled={contentState.isGenerating}
                    >
                      {contentState.isGenerating ? (
                        <>
                          <FaSpinner />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaLightbulb />
                          Generate Content
                        </>
                      )}
                    </GenerateButton>
                  </ContentForm>
                ) : (
                  <GeneratedContentDisplay>
                    <GeneratedContentHeader>
                      <GeneratedContentTitle>
                        Generated {contentState.contentType.replace('-', ' ')} for {contentState.platform}
                      </GeneratedContentTitle>
                      <ContentMeta>
                        {contentState.generatedContent.characterCount} characters • {contentState.generatedContent.tone} tone
                      </ContentMeta>
                    </GeneratedContentHeader>

                    <ContentPreview>
                      <ContentText>{contentState.generatedContent.content}</ContentText>
                      {contentState.generatedContent.hashtags.length > 0 && (
                        <HashtagsList>
                          {contentState.generatedContent.hashtags.map((tag, index) => (
                            <Hashtag key={index}>{tag}</Hashtag>
                          ))}
                        </HashtagsList>
                      )}
                    </ContentPreview>

                    <ContentActions>
                      <CopyButton 
                        onClick={() => copyToClipboard(
                          contentState.generatedContent!.content + 
                          (contentState.generatedContent!.hashtags.length > 0 ? 
                            '\n\n' + contentState.generatedContent!.hashtags.join(' ') : '')
                        )}
                      >
                        {contentState.copiedToClipboard ? <FaCheck /> : <FaCopy />}
                        {contentState.copiedToClipboard ? 'Copied!' : 'Copy to Clipboard'}
                      </CopyButton>
                      
                      <RegenerateButton onClick={() => {
                        setContentState(prev => ({ ...prev, generatedContent: null }));
                      }}>
                        <FaLightbulb />
                        Generate New
                      </RegenerateButton>
                    </ContentActions>

                    {contentState.generatedContent.metadata.ctas.length > 0 && (
                      <CTASuggestions>
                        <CTATitle>Suggested CTAs:</CTATitle>
                        <CTAList>
                          {contentState.generatedContent.metadata.ctas.map((cta, index) => (
                            <CTAItem key={index}>{cta}</CTAItem>
                          ))}
                        </CTAList>
                      </CTASuggestions>
                    )}
                  </GeneratedContentDisplay>
                )}
              </ContentPanelBody>
            </ContentPanel>
          </ContentPanelOverlay>
        )}
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
  display: flex;
  gap: 1rem;
  height: calc(100vh - 200px);

  @media (max-width: 1024px) {
    flex-direction: column;
    height: auto;
  }
`;


const MainContent = styled.div`
  flex: 1;
`;

const RightSidebar = styled.div`
  width: 300px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 100%;
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
  flex: 1;
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

// Content Generation Panel Styles
const ContentPanelOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ContentPanel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ContentPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ContentPanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const ContentPanelBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const ContentForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const GenerateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #7a6f4d;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const GeneratedContentDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const GeneratedContentHeader = styled.div`
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const GeneratedContentTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  text-transform: capitalize;
`;

const ContentMeta = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const ContentPreview = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
`;

const ContentText = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 1rem;
`;

const HashtagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const Hashtag = styled.span`
  background: #96885f;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ContentActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

const RegenerateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #4b5563;
    transform: translateY(-1px);
  }
`;

const CTASuggestions = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
`;

const CTATitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #92400e;
`;

const CTAList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CTAItem = styled.div`
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #374151;
  border-left: 3px solid #f59e0b;
`;

const ConversationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const ConversationItem = styled.div<{ active: boolean }>`
  padding: 0.75rem;
  background: ${props => props.active ? '#f0f8ff' : '#f8f9fa'};
  border: 1px solid ${props => props.active ? '#96885f' : '#e9ecef'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${props => props.active ? '#e6f3ff' : '#e9ecef'};
    border-color: #96885f;
  }
`;

const ConversationTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ConversationMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #666;
`;

const ActiveIndicator = styled.span`
  background: #10b981;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const ConversationActions = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${ConversationItem}:hover & {
    opacity: 1;
  }
`;

const ConversationActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
`;

const ConversationLoading = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const ConversationEmpty = styled.div`
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
`;

// Quick Actions Styles
const QuickActionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const QuickActionButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${props => props.disabled ? '#f8f9fa' : 'white'};
  border: 1px solid ${props => props.disabled ? '#e9ecef' : '#e9ecef'};
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.disabled ? '#9ca3af' : '#374151'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  text-align: left;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover {
    background: ${props => props.disabled ? '#f8f9fa' : '#f8f9fa'};
    border-color: ${props => props.disabled ? '#e9ecef' : '#96885f'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
  }

  svg {
    color: ${props => props.disabled ? '#9ca3af' : '#96885f'};
    font-size: 1rem;
  }
`;

// Profile Progress Styles
const ProfileProgressContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
`;

const ProfileProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

const ProfileProgressFill = styled.div<{ width: number }>`
  height: 100%;
  background: linear-gradient(90deg, #96885f, #10b981);
  width: ${props => props.width}%;
  transition: width 0.3s ease;
`;

const ProfileProgressText = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
  margin-bottom: 1rem;
`;

const ProfileProgressSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProfileStep = styled.div<{ completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${props => props.completed ? '#10b981' : '#9ca3af'};
  font-weight: ${props => props.completed ? '600' : '400'};

  svg {
    font-size: 0.75rem;
    opacity: ${props => props.completed ? '1' : '0.5'};
  }
`; 