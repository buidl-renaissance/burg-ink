'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaPlay, FaCheck, FaTimes, FaSpinner, FaCode, FaMicrophone, FaComments } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import ContentAssistantWidget from '@/components/ContentAssistantWidget';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }, { label: 'Content Assistant Test', href: '/admin/content-assistant-test' }],
      currentPage: 'content-assistant-test'
    }
  }
};

export default function ContentAssistantTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState('all');
  
  const { toasts, success, error, loading, removeToast } = useToast();

  const testTypes = [
    { id: 'all', name: 'All Features', description: 'Test all content management features' },
    { id: 'command-parsing', name: 'Command Parsing', description: 'Test natural language command parsing' },
    { id: 'content-suggestions', name: 'Content Suggestions', description: 'Test AI content suggestion generation' },
    { id: 'hardcoded-content', name: 'Hardcoded Content', description: 'Test hardcoded content management' },
    { id: 'workflow-execution', name: 'Workflow Execution', description: 'Test content change workflows' },
    { id: 'voice-integration', name: 'Voice Integration', description: 'Test voice input capabilities' }
  ];

  const runTest = async (testType: string) => {
    setIsRunning(true);
    loading({
      title: 'Running Tests...',
      message: `Testing ${testType} functionality`
    });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/content-assistant/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          testType,
          testData: {}
        }),
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const data = await response.json();
      setTestResults(data.results);

      if (data.success) {
        success({
          title: 'Tests Completed',
          message: `Successfully tested ${testType} functionality`
        });
      } else {
        error({
          title: 'Tests Failed',
          message: data.error || 'Some tests failed to complete'
        });
      }

    } catch (err) {
      console.error('Test execution error:', err);
      error({
        title: 'Test Error',
        message: err instanceof Error ? err.message : 'Failed to run tests'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <ResultsContainer>
        <ResultsHeader>
          <ResultsTitle>Test Results</ResultsTitle>
          <ResultsMeta>
            {testResults.timestamp && new Date(testResults.timestamp).toLocaleString()}
          </ResultsMeta>
        </ResultsHeader>

        <ResultsContent>
          {Object.entries(testResults.results).map(([key, result]: [string, any]) => (
            <ResultSection key={key}>
              <ResultSectionTitle>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</ResultSectionTitle>
              <ResultSectionContent>
                {result.errors && result.errors.length > 0 && (
                  <ErrorList>
                    {result.errors.map((err: any, index: number) => (
                      <ErrorItem key={index}>
                        <FaTimes />
                        {err.error || err.message || 'Unknown error'}
                      </ErrorItem>
                    ))}
                  </ErrorList>
                )}
                
                {result.success !== undefined && (
                  <SuccessIndicator success={result.success}>
                    <FaCheck />
                    {result.success ? 'Success' : 'Failed'}
                  </SuccessIndicator>
                )}

                <ResultDetails>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </ResultDetails>
              </ResultSectionContent>
            </ResultSection>
          ))}
        </ResultsContent>
      </ResultsContainer>
    );
  };

  return (
    <AdminLayout currentPage="content-assistant-test">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Container>
        <Header>
          <Title>
            <FaCode />
            Content Assistant Test Suite
          </Title>
          <Subtitle>Test and validate content management assistant functionality</Subtitle>
        </Header>

        <TestControls>
          <TestSelector>
            <TestSelectorLabel>Select Test Type:</TestSelectorLabel>
            <TestSelectorDropdown
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              disabled={isRunning}
            >
              {testTypes.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name}
                </option>
              ))}
            </TestSelectorDropdown>
          </TestSelector>

          <RunButton 
            onClick={() => runTest(selectedTest)}
            disabled={isRunning}
          >
            {isRunning ? <FaSpinner /> : <FaPlay />}
            {isRunning ? 'Running...' : 'Run Test'}
          </RunButton>
        </TestControls>

        <TestTypesGrid>
          {testTypes.map((test) => (
            <TestTypeCard key={test.id}>
              <TestTypeIcon>
                {test.id === 'voice-integration' ? <FaMicrophone /> : <FaCode />}
              </TestTypeIcon>
              <TestTypeName>{test.name}</TestTypeName>
              <TestTypeDescription>{test.description}</TestTypeDescription>
              <TestTypeButton
                onClick={() => runTest(test.id)}
                disabled={isRunning}
              >
                {isRunning ? <FaSpinner /> : <FaPlay />}
                Run Test
              </TestTypeButton>
            </TestTypeCard>
          ))}
        </TestTypesGrid>

        {renderTestResults()}
      </Container>

      <ContentAssistantWidget />
    </AdminLayout>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;
`;

const TestControls = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const TestSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TestSelectorLabel = styled.label`
  font-weight: 600;
  color: #374151;
`;

const TestSelectorDropdown = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 1rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const RunButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #7a6f4d;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    transform: none;
  }
`;

const TestTypesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TestTypeCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: #96885f;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const TestTypeIcon = styled.div`
  font-size: 2rem;
  color: #96885f;
  margin-bottom: 1rem;
`;

const TestTypeName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
`;

const TestTypeDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const TestTypeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #96885f;
    color: white;
    border-color: #96885f;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
`;

const ResultsTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
`;

const ResultsMeta = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ResultsContent = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const ResultSection = styled.div`
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const ResultSectionTitle = styled.h4`
  margin: 0;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const ResultSectionContent = styled.div`
  padding: 1.5rem;
`;

const ErrorList = styled.div`
  margin-bottom: 1rem;
`;

const ErrorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SuccessIndicator = styled.div<{ success: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: ${props => props.success ? '#f0fdf4' : '#fef2f2'};
  color: ${props => props.success ? '#16a34a' : '#dc2626'};
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const ResultDetails = styled.div`
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;

  pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.75rem;
    line-height: 1.4;
    color: #374151;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
`;
