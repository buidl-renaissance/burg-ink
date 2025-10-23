'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaComments, FaMicrophone, FaMicrophoneSlash, FaCheck, FaTimes, FaTrash, FaSpinner, FaBolt, FaEye, FaEdit, FaPlus, FaSearch, FaHistory, FaCog } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import VoiceInput from '@/components/VoiceInput';

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

interface ConversationThread {
  id: number;
  title: string;
  messages: Message[];
  context?: any;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface ConversationState {
  currentConversationId: number | null;
  conversations: ConversationThread[];
  isLoadingConversations: boolean;
}

interface ContentState {
  suggestions: ContentSuggestion[];
  pendingApprovals: ContentSuggestion[];
  recentChanges: any[];
  isLoading: boolean;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }, { label: 'Content Assistant', href: '/admin/content-assistant' }],
      currentPage: 'content-assistant'
    }
  }
};

export default function ContentAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI content management assistant. I can help you create, update, and manage your website content. What would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(null);
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Conversation state
  const [conversationState, setConversationState] = useState<ConversationState>({
    currentConversationId: null,
    conversations: [],
    isLoadingConversations: false
  });

  // Content state
  const [contentState, setContentState] = useState<ContentState>({
    suggestions: [],
    pendingApprovals: [],
    recentChanges: [],
    isLoading: false
  });

  // Track initialization state
  const [isInitialized, setIsInitialized] = useState(false);

  // Local storage keys
  const CONVERSATIONS_CACHE_KEY = 'content_assistant_conversations';
  const CURRENT_CONVERSATION_KEY = 'content_assistant_current_conversation';
  const CACHE_TIMESTAMP_KEY = 'content_assistant_cache_timestamp';
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  const scrollToBottom = () => {
    messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
  };

  // Local storage helper functions
  const saveConversationsToCache = (conversations: ConversationThread[]) => {
    try {
      localStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(conversations));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 Cached conversations to local storage');
    } catch (error) {
      console.warn('Failed to cache conversations:', error);
    }
  };

  const loadConversationsFromCache = (): ConversationThread[] | null => {
    try {
      const cached = localStorage.getItem(CONVERSATIONS_CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) return null;
      
      const cacheAge = Date.now() - parseInt(timestamp);
      if (cacheAge > CACHE_EXPIRY_MS) {
        console.log('🗑️ Cache expired, clearing...');
        localStorage.removeItem(CONVERSATIONS_CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        localStorage.removeItem(CURRENT_CONVERSATION_KEY);
        return null;
      }
      
      const conversations = JSON.parse(cached);
      console.log('📦 Loaded conversations from cache:', conversations.length);
      
      return conversations as ConversationThread[];
    } catch (error) {
      console.warn('Failed to load conversations from cache:', error);
      return null;
    }
  };

  const saveCurrentConversationToCache = (conversationId: number) => {
    try {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId.toString());
      console.log('💾 Cached current conversation:', conversationId);
    } catch (error) {
      console.warn('Failed to cache current conversation:', error);
    }
  };

  const loadCurrentConversationFromCache = (): number | null => {
    try {
      const cached = localStorage.getItem(CURRENT_CONVERSATION_KEY);
      return cached ? parseInt(cached) : null;
    } catch (error) {
      console.warn('Failed to load current conversation:', error);
      return null;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = useCallback(async (conversationId: number) => {
    try {
      console.log('Loading conversation:', conversationId);
      const conversation = conversationState.conversations.find(c => c.id === conversationId);
      if (conversation) {
        console.log('Found conversation:', conversation.title, 'Messages:', conversation.messages.length);
        const messagesWithDates = conversation.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        setConversationState(prev => ({
          ...prev,
          currentConversationId: conversationId
        }));
        
        saveCurrentConversationToCache(conversationId);
        console.log('Conversation loaded successfully');
      } else {
        console.log('Conversation not found:', conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [conversationState.conversations]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('Starting initialization...');
        
        await loadConversations();
        await loadContentState();
        
        setIsInitialized(true);
        console.log('Initialization complete');
      } catch (error) {
        console.error('Error initializing content assistant data:', error);
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  // Auto-load conversation after initialization
  useEffect(() => {
    if (isInitialized && 
        !conversationState.isLoadingConversations && 
        conversationState.conversations.length > 0 && 
        !conversationState.currentConversationId) {
      
      console.log('Auto-loading conversation after initialization...');
      
      const cachedCurrentConversationId = loadCurrentConversationFromCache();
      if (cachedCurrentConversationId) {
        const cachedConversation = conversationState.conversations.find(c => c.id === cachedCurrentConversationId);
        if (cachedConversation) {
          console.log('🎯 Loading cached current conversation:', cachedConversation.id, cachedConversation.title);
          loadConversation(cachedCurrentConversationId);
          return;
        }
      }
      
      const lastConversation = conversationState.conversations
        .sort((a, b) => new Date(b.last_message_at || b.updated_at || b.created_at).getTime() - new Date(a.last_message_at || a.updated_at || a.created_at).getTime())[0];
      
      if (lastConversation) {
        console.log('📋 Auto-loading most recent conversation:', lastConversation.id, lastConversation.title);
        loadConversation(lastConversation.id);
      }
    }
  }, [isInitialized, conversationState.conversations, conversationState.currentConversationId, conversationState.isLoadingConversations, loadConversation]);

  const loadConversations = async (): Promise<void> => {
    setConversationState(prev => ({ ...prev, isLoadingConversations: true }));
    
    try {
      const cachedConversations = loadConversationsFromCache();
      
      if (cachedConversations && cachedConversations.length > 0) {
        console.log('🚀 Using cached conversations for instant load');
        setConversationState(prev => ({
          ...prev,
          conversations: cachedConversations,
          isLoadingConversations: false
        }));
        
        loadConversationsFromAPI();
        return;
      }
      
      await loadConversationsFromAPI();
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversationState(prev => ({ ...prev, isLoadingConversations: false }));
    }
  };

  const loadConversationsFromAPI = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant/conversations', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Loaded conversations from API:', data.conversations.length);
        
        const conversationsWithDates = data.conversations.map((conv: ConversationThread) => ({
          ...conv,
          lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : new Date(),
          createdAt: conv.created_at ? new Date(conv.created_at) : new Date(),
          updatedAt: conv.updated_at ? new Date(conv.updated_at) : new Date()
        }));
        
        saveConversationsToCache(conversationsWithDates);
        
        setConversationState(prev => ({
          ...prev,
          conversations: conversationsWithDates,
          isLoadingConversations: false
        }));
      } else {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading conversations from API:', error);
      setConversationState(prev => ({ ...prev, isLoadingConversations: false }));
    }
  };

  const loadContentState = async (): Promise<void> => {
    setContentState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const token = localStorage.getItem('authToken');
      
      // Load suggestions
      const suggestionsResponse = await fetch('/api/content-assistant/suggestions', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setContentState(prev => ({
          ...prev,
          suggestions: suggestionsData.suggestions,
          pendingApprovals: suggestionsData.suggestions.filter((s: ContentSuggestion) => s.status === 'pending')
        }));
      }
      
      // Load recent changes
      const changesResponse = await fetch('/api/content-assistant/execute', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (changesResponse.ok) {
        const changesData = await changesResponse.json();
        setContentState(prev => ({
          ...prev,
          recentChanges: changesData.executions || []
        }));
      }
      
    } catch (error) {
      console.error('Error loading content state:', error);
    } finally {
      setContentState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const generateResponse = async (userInput: string): Promise<string> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: userInput,
          conversationId: conversationState.currentConversationId,
          context: {
            currentPage: 'content-assistant',
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Update suggestions if provided
      if (data.suggestions && data.suggestions.length > 0) {
        setContentState(prev => ({
          ...prev,
          suggestions: [...prev.suggestions, ...data.suggestions],
          pendingApprovals: [...prev.pendingApprovals, ...data.suggestions.filter((s: ContentSuggestion) => s.status === 'pending')]
        }));
      }

      return data.message;
    } catch (error) {
      console.error('Error calling content assistant API:', error);
      throw new Error('Failed to get response from content assistant');
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
      const response = await generateResponse(inputValue);

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

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript);
  };

  const handleVoiceError = (error: string) => {
    warning({
      title: 'Voice Input Error',
      message: error
    });
  };

  const approveSuggestion = async (suggestionId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          id: suggestionId,
          action: 'approve'
        }),
      });

      if (response.ok) {
        setContentState(prev => ({
          ...prev,
          suggestions: prev.suggestions.map(s => 
            s.id === suggestionId ? { ...s, status: 'approved' as const } : s
          ),
          pendingApprovals: prev.pendingApprovals.filter(s => s.id !== suggestionId)
        }));
        
        success({
          title: 'Suggestion Approved',
          message: 'The content change has been approved and is ready to execute.'
        });
      }
    } catch (error) {
      console.error('Error approving suggestion:', error);
      error({
        title: 'Approval Failed',
        message: 'Failed to approve the suggestion. Please try again.'
      });
    }
  };

  const rejectSuggestion = async (suggestionId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          id: suggestionId,
          action: 'reject'
        }),
      });

      if (response.ok) {
        setContentState(prev => ({
          ...prev,
          suggestions: prev.suggestions.map(s => 
            s.id === suggestionId ? { ...s, status: 'rejected' as const } : s
          ),
          pendingApprovals: prev.pendingApprovals.filter(s => s.id !== suggestionId)
        }));
        
        success({
          title: 'Suggestion Rejected',
          message: 'The content change has been rejected.'
        });
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      error({
        title: 'Rejection Failed',
        message: 'Failed to reject the suggestion. Please try again.'
      });
    }
  };

  const executeApprovedChanges = async () => {
    const approvedSuggestions = contentState.suggestions.filter(s => s.status === 'approved');
    
    if (approvedSuggestions.length === 0) {
      warning({
        title: 'No Approved Changes',
        message: 'There are no approved changes to execute.'
      });
      return;
    }

    loading({
      title: 'Executing Changes...',
      message: `Applying ${approvedSuggestions.length} approved change(s)`
    });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          suggestionIds: approvedSuggestions.map(s => s.id)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          success({
            title: 'Changes Executed',
            message: `Successfully applied ${data.executedCount} change(s).`
          });
          
          // Update state
          setContentState(prev => ({
            ...prev,
            suggestions: prev.suggestions.map(s => 
              approvedSuggestions.some(approved => approved.id === s.id) 
                ? { ...s, status: 'applied' as const }
                : s
            ),
            pendingApprovals: prev.pendingApprovals.filter(s => 
              !approvedSuggestions.some(approved => approved.id === s.id)
            )
          }));
        } else {
          error({
            title: 'Execution Failed',
            message: data.message || 'Some changes failed to execute.'
          });
        }
      }
    } catch (error) {
      console.error('Error executing changes:', error);
      error({
        title: 'Execution Failed',
        message: 'Failed to execute changes. Please try again.'
      });
    }
  };

  const startNewConversation = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI content management assistant. I can help you create, update, and manage your website content. What would you like to work on today?",
      timestamp: new Date()
    }]);
    setConversationState(prev => ({
      ...prev,
      currentConversationId: null
    }));
  };

  return (
    <AdminLayout currentPage="content-assistant">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Container>
        <Header>
          <Title>
            <FaComments />
            Content Management Assistant
          </Title>
          <Subtitle>AI-powered content management with voice activation</Subtitle>
        </Header>

        <Content>
          <MainContent>
            <ChatSection>
              <ChatHeader>
                <ChatTitle>Content Management Chat</ChatTitle>
                <ResetButton onClick={startNewConversation}>
                  <FaPlus /> New Conversation
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
                <div ref={setMessagesEndRef} />
              </MessagesContainer>

              <InputSection>
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  onError={handleVoiceError}
                  placeholder="Type or speak your content management command..."
                  autoSubmit={false}
                  confidenceThreshold={0.7}
                />
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
                        {new Date(conversation.last_message_at || conversation.created_at).toLocaleDateString()}
                        {conversation.is_active && <ActiveIndicator>Active</ActiveIndicator>}
                      </ConversationMeta>
                    </ConversationItem>
                  ))
                )}
              </ConversationList>
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>
                <FaBolt />
                Pending Approvals
              </SidebarTitle>
              
              <ApprovalList>
                {contentState.pendingApprovals.length === 0 ? (
                  <ApprovalEmpty>No pending approvals</ApprovalEmpty>
                ) : (
                  contentState.pendingApprovals.map((suggestion) => (
                    <ApprovalItem key={suggestion.id}>
                      <ApprovalContent>
                        <ApprovalType>{suggestion.content_type}</ApprovalType>
                        <ApprovalDescription>{suggestion.reasoning}</ApprovalDescription>
                        <ApprovalValue>
                          {suggestion.current_value && (
                            <span>From: {suggestion.current_value}</span>
                          )}
                          <span>To: {suggestion.suggested_value}</span>
                        </ApprovalValue>
                      </ApprovalContent>
                      <ApprovalActions>
                        <ApproveButton onClick={() => suggestion.id && approveSuggestion(suggestion.id)}>
                          <FaCheck />
                        </ApproveButton>
                        <RejectButton onClick={() => suggestion.id && rejectSuggestion(suggestion.id)}>
                          <FaTimes />
                        </RejectButton>
                      </ApprovalActions>
                    </ApprovalItem>
                  ))
                )}
              </ApprovalList>
              
              {contentState.suggestions.filter(s => s.status === 'approved').length > 0 && (
                <ExecuteButton onClick={executeApprovedChanges}>
                  <FaBolt />
                  Execute Approved Changes ({contentState.suggestions.filter(s => s.status === 'approved').length})
                </ExecuteButton>
              )}
            </SidebarSection>

            <SidebarSection>
              <SidebarTitle>
                <FaHistory />
                Recent Changes
              </SidebarTitle>
              
              <ChangesList>
                {contentState.recentChanges.length === 0 ? (
                  <ChangesEmpty>No recent changes</ChangesEmpty>
                ) : (
                  contentState.recentChanges.slice(0, 5).map((change) => (
                    <ChangeItem key={change.id}>
                      <ChangeType>{change.content_type}</ChangeType>
                      <ChangeAction>{change.action}</ChangeAction>
                      <ChangeTime>
                        {new Date(change.created_at).toLocaleString()}
                      </ChangeTime>
                    </ChangeItem>
                  ))
                )}
              </ChangesList>
            </SidebarSection>
          </RightSidebar>
        </Content>
      </Container>
    </AdminLayout>
  );
}

// Styled components (similar to marketing-assistant but adapted for content management)
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
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
  width: 350px;
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
  margin-top: 1rem;
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
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

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

const ApprovalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ApprovalItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const ApprovalContent = styled.div`
  flex: 1;
`;

const ApprovalType = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #96885f;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const ApprovalDescription = styled.div`
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.5rem;
  line-height: 1.4;
`;

const ApprovalValue = styled.div`
  font-size: 0.8rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ApprovalActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ApproveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
    transform: scale(1.05);
  }
`;

const RejectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #dc2626;
    transform: scale(1.05);
  }
`;

const ApprovalEmpty = styled.div`
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
`;

const ExecuteButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

const ChangesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const ChangeItem = styled.div`
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ChangeType = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #96885f;
  text-transform: uppercase;
`;

const ChangeAction = styled.div`
  font-size: 0.9rem;
  color: #333;
`;

const ChangeTime = styled.div`
  font-size: 0.75rem;
  color: #666;
`;

const ChangesEmpty = styled.div`
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
`;
