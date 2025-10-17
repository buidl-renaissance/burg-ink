'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSpinner, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { WorkflowRuleBuilder } from '../../components/WorkflowRuleBuilder';
import { AdminLayout } from '../../components/AdminLayout';

interface WorkflowCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

interface WorkflowAction {
  type: string;
  params: Record<string, unknown>;
}

interface WorkflowRule {
  id?: number;
  name: string;
  description?: string;
  trigger: string;
  conditions: Record<string, WorkflowCondition>;
  actions: WorkflowAction[];
  is_enabled: number;
  priority: number;
  last_fired_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function WorkflowsAdmin() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setTesting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workflows');
      if (!response.ok) {
        throw new Error('Failed to fetch workflow rules');
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflow rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: WorkflowRule) => {
    try {
      setSaving(true);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow rule');
      }

      await fetchWorkflows();
      setCreatingRule(false);

    } catch (err) {
      throw err; // Re-throw to be handled by the builder
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRule = async (ruleData: WorkflowRule) => {
    if (!editingRule?.id) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/workflows/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow rule');
      }

      await fetchWorkflows();
      setEditingRule(null);

    } catch (err) {
      throw err; // Re-throw to be handled by the builder
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow rule');
      }

      await fetchWorkflows();

    } catch (err) {
      alert(`Failed to delete workflow rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleToggleRule = async (id: number, isEnabled: number) => {
    try {
      const response = await fetch(`/api/workflows/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: isEnabled === 1 ? 0 : 1 })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle workflow rule');
      }

      await fetchWorkflows();

    } catch (err) {
      alert(`Failed to toggle workflow rule: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleTestRule = async (ruleData: WorkflowRule) => {
    try {
      setTesting(true);
      const response = await fetch(`/api/workflows/${editingRule?.id || 'test'}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error('Failed to test workflow rule');
      }

      const result = await response.json();
      return result;

    } catch (err) {
      throw err;
    } finally {
      setTesting(false);
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'on_upload': 'On Media Upload',
      'on_classification': 'On AI Classification',
      'on_publish': 'On Entity Publish',
      'on_status_change': 'On Status Change',
    };
    return labels[trigger] || trigger;
  };

  const getActionLabels = (actions: WorkflowAction[]) => {
    const actionLabels: Record<string, string> = {
      'flag_media': 'Flag Media',
      'apply_tags': 'Apply Tags',
      'create_entity': 'Create Entity',
      'notify_admin': 'Notify Admin',
      'set_status': 'Set Status',
      'send_email': 'Send Email',
    };
    return actions.map(action => actionLabels[action.type] || action.type).join(', ');
  };

  const sortedWorkflows = [...workflows].sort((a, b) => {
    // Sort by enabled first, then by priority, then by name
    if (a.is_enabled !== b.is_enabled) {
      return b.is_enabled - a.is_enabled;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.name.localeCompare(b.name);
  });

  if (creatingRule) {
    return (
      <AdminLayout>
        <WorkflowRuleBuilder
          onSave={handleCreateRule}
          onCancel={() => setCreatingRule(false)}
          onTest={handleTestRule}
          saving={saving}
        />
      </AdminLayout>
    );
  }

  if (editingRule) {
    return (
      <AdminLayout>
        <WorkflowRuleBuilder
          rule={editingRule}
          onSave={handleUpdateRule}
          onCancel={() => setEditingRule(null)}
          onTest={handleTestRule}
          saving={saving}
        />
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <LoadingContainer>
          <FaSpinner className="spinner" />
          Loading workflow rules...
        </LoadingContainer>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <ErrorContainer>
          <ErrorMessage>{error}</ErrorMessage>
          <RetryButton onClick={fetchWorkflows}>Retry</RetryButton>
        </ErrorContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container>
        <Header>
          <HeaderLeft>
            <Title>Workflow Rules</Title>
            <Subtitle>
              Automate actions based on triggers and conditions
            </Subtitle>
          </HeaderLeft>
          <HeaderActions>
            <CreateButton onClick={() => setCreatingRule(true)}>
              <FaPlus />
              Create Rule
            </CreateButton>
            <RefreshButton onClick={fetchWorkflows}>
              Refresh
            </RefreshButton>
          </HeaderActions>
        </Header>

        <StatsContainer>
          <StatCard>
            <StatNumber>{workflows.length}</StatNumber>
            <StatLabel>Total Rules</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{workflows.filter(w => w.is_enabled === 1).length}</StatNumber>
            <StatLabel>Enabled</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{workflows.filter(w => w.last_fired_at).length}</StatNumber>
            <StatLabel>Executed</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>
              {workflows.length > 0 
                ? Math.round((workflows.filter(w => w.is_enabled === 1).length / workflows.length) * 100)
                : 0}%
            </StatNumber>
            <StatLabel>Active Rate</StatLabel>
          </StatCard>
        </StatsContainer>

        <WorkflowsList>
          {sortedWorkflows.map((workflow) => (
            <WorkflowCard key={workflow.id || `workflow-${Math.random()}`} enabled={workflow.is_enabled === 1}>
              <CardHeader>
                <CardHeaderLeft>
                  <CardTitle>{workflow.name}</CardTitle>
                  <CardTrigger>{getTriggerLabel(workflow.trigger)}</CardTrigger>
                </CardHeaderLeft>
                <CardHeaderRight>
                  <PriorityBadge priority={workflow.priority}>
                    Priority: {workflow.priority}
                  </PriorityBadge>
                  <ToggleButton
                    onClick={() => workflow.id && handleToggleRule(workflow.id, workflow.is_enabled)}
                    enabled={workflow.is_enabled === 1}
                  >
                    {workflow.is_enabled === 1 ? <FaToggleOn /> : <FaToggleOff />}
                  </ToggleButton>
                </CardHeaderRight>
              </CardHeader>

              <CardContent>
                {workflow.description && (
                  <CardDescription>{workflow.description}</CardDescription>
                )}
                
                <CardDetails>
                  <DetailRow>
                    <DetailLabel>Actions:</DetailLabel>
                    <DetailValue>{getActionLabels(workflow.actions)}</DetailValue>
                  </DetailRow>
                  
                  {workflow.last_fired_at && (
                    <DetailRow>
                      <DetailLabel>Last Executed:</DetailLabel>
                      <DetailValue>
                        {workflow.last_fired_at ? new Date(workflow.last_fired_at).toLocaleString() : 'Never'}
                      </DetailValue>
                    </DetailRow>
                  )}
                  
                  <DetailRow>
                    <DetailLabel>Created:</DetailLabel>
                    <DetailValue>
                      {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : 'Unknown'}
                    </DetailValue>
                  </DetailRow>
                </CardDetails>
              </CardContent>

              <CardActions>
                <ActionButton 
                  onClick={() => setEditingRule(workflow)}
                  primary
                >
                  <FaEdit />
                  Edit
                </ActionButton>
                <ActionButton 
                  onClick={() => workflow.id && handleDeleteRule(workflow.id)}
                  danger
                >
                  <FaTrash />
                  Delete
                </ActionButton>
              </CardActions>
            </WorkflowCard>
          ))}
        </WorkflowsList>

        {workflows.length === 0 && (
          <EmptyState>
            <EmptyIcon>⚡</EmptyIcon>
            <EmptyTitle>No Workflow Rules</EmptyTitle>
            <EmptyDescription>
              Create your first workflow rule to automate actions based on triggers and conditions.
            </EmptyDescription>
            <EmptyActions>
              <CreateButton onClick={() => setCreatingRule(true)}>
                <FaPlus />
                Create First Rule
              </CreateButton>
            </EmptyActions>
          </EmptyState>
        )}
      </Container>
    </AdminLayout>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 2rem;
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const CreateButton = styled.button`
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #047857;
  }
`;

const RefreshButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
`;

const WorkflowsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WorkflowCard = styled.div<{ enabled: boolean }>`
  background: white;
  border: 2px solid ${props => props.enabled ? '#e5e7eb' : '#f3f4f6'};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  opacity: ${props => props.enabled ? 1 : 0.8};

  &:hover {
    border-color: ${props => props.enabled ? '#3b82f6' : '#d1d5db'};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  gap: 1rem;
`;

const CardHeaderLeft = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
`;

const CardTrigger = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
`;

const CardHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
`;

const PriorityBadge = styled.div<{ priority: number }>`
  background: ${props => {
    if (props.priority <= 0) return '#dc2626';
    if (props.priority <= 5) return '#d97706';
    if (props.priority <= 10) return '#059669';
    return '#6b7280';
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ToggleButton = styled.button<{ enabled: boolean }>`
  background: none;
  border: none;
  color: ${props => props.enabled ? '#059669' : '#9ca3af'};
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.enabled ? '#047857' : '#6b7280'};
  }
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const CardDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  line-height: 1.5;
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DetailLabel = styled.div`
  font-weight: 500;
  color: #374151;
  min-width: 120px;
  font-size: 0.9rem;
`;

const DetailValue = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
  flex: 1;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const ActionButton = styled.button<{ primary?: boolean; danger?: boolean }>`
  background: ${props => {
    if (props.danger) return '#fee2e2';
    if (props.primary) return '#dbeafe';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.danger) return '#dc2626';
    if (props.primary) return '#2563eb';
    return '#374151';
  }};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => {
      if (props.danger) return '#fecaca';
      if (props.primary) return '#bfdbfe';
      return '#e5e7eb';
    }};
    transform: translateY(-1px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
  font-size: 1.1rem;

  .spinner {
    animation: spin 1s linear infinite;
    margin-right: 0.75rem;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
`;

const RetryButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #b91c1c;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  text-align: center;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
`;

const EmptyDescription = styled.p`
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1rem;
`;

const EmptyActions = styled.div`
  display: flex;
  gap: 1rem;
`;
