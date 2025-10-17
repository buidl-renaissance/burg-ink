'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaTrash, FaSave, FaTimes, FaPlay, FaSpinner, FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface WorkflowRule {
  id?: number;
  name: string;
  description?: string;
  trigger: string;
  conditions: any;
  actions: any[];
  is_enabled: number;
  priority: number;
}

interface WorkflowRuleBuilderProps {
  rule?: WorkflowRule;
  onSave: (rule: WorkflowRule) => Promise<void>;
  onCancel: () => void;
  onTest?: (rule: WorkflowRule) => Promise<any>;
  saving?: boolean;
  className?: string;
}

const TRIGGER_OPTIONS = [
  { value: 'on_upload', label: 'On Media Upload' },
  { value: 'on_classification', label: 'On AI Classification' },
  { value: 'on_publish', label: 'On Entity Publish' },
  { value: 'on_status_change', label: 'On Status Change' },
];

const CONDITION_FIELDS = {
  on_upload: [
    { value: 'mime_type', label: 'File Type', type: 'select', options: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
    { value: 'size', label: 'File Size (MB)', type: 'number' },
    { value: 'filename', label: 'Filename Contains', type: 'text' },
  ],
  on_classification: [
    { value: 'detected_type', label: 'Detected Type', type: 'select', options: ['tattoo', 'artwork', 'unknown'] },
    { value: 'min_confidence', label: 'Min Confidence', type: 'number', min: 0, max: 1, step: 0.1 },
    { value: 'has_tags', label: 'Has Tags', type: 'text' },
  ],
  on_publish: [
    { value: 'entity_type', label: 'Entity Type', type: 'select', options: ['tattoo', 'artwork'] },
    { value: 'category', label: 'Category', type: 'text' },
    { value: 'artist_id', label: 'Artist ID', type: 'number' },
  ],
  on_status_change: [
    { value: 'old_status', label: 'Old Status', type: 'text' },
    { value: 'new_status', label: 'New Status', type: 'text' },
  ],
};

const ACTION_TYPES = [
  { value: 'flag_media', label: 'Flag Media', description: 'Add a flag to the media record' },
  { value: 'apply_tags', label: 'Apply Tags', description: 'Automatically apply taxonomy tags' },
  { value: 'create_entity', label: 'Create Entity', description: 'Auto-create tattoo or artwork entity' },
  { value: 'notify_admin', label: 'Notify Admin', description: 'Send notification to administrators' },
  { value: 'set_status', label: 'Set Status', description: 'Update processing status' },
  { value: 'send_email', label: 'Send Email', description: 'Send email notification' },
];

export const WorkflowRuleBuilder: React.FC<WorkflowRuleBuilderProps> = ({
  rule,
  onSave,
  onCancel,
  onTest,
  saving = false,
  className
}) => {
  const [formData, setFormData] = useState<WorkflowRule>({
    name: '',
    description: '',
    trigger: 'on_upload',
    conditions: {},
    actions: [],
    is_enabled: 1,
    priority: 0,
    ...rule
  });

  const [expandedSections, setExpandedSections] = useState({
    conditions: true,
    actions: true,
    preview: false
  });

  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
    }
  }, [rule]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Rule name is required');
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      alert(`Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;

    try {
      setTesting(true);
      setTestResult(null);
      const result = await onTest(formData);
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const addCondition = () => {
    const availableFields = CONDITION_FIELDS[formData.trigger as keyof typeof CONDITION_FIELDS] || [];
    if (availableFields.length === 0) return;

    const newCondition = {
      field: availableFields[0].value,
      operator: 'equals',
      value: ''
    };

    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        [`condition_${Date.now()}`]: newCondition
      }
    });
  };

  const updateCondition = (key: string, updates: any) => {
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        [key]: { ...formData.conditions[key], ...updates }
      }
    });
  };

  const removeCondition = (key: string) => {
    const newConditions = { ...formData.conditions };
    delete newConditions[key];
    setFormData({ ...formData, conditions: newConditions });
  };

  const addAction = () => {
    const newAction = {
      type: ACTION_TYPES[0].value,
      params: {}
    };

    setFormData({
      ...formData,
      actions: [...formData.actions, newAction]
    });
  };

  const updateAction = (index: number, updates: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index: number) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    setFormData({ ...formData, actions: newActions });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const getConditionFields = () => {
    return CONDITION_FIELDS[formData.trigger as keyof typeof CONDITION_FIELDS] || [];
  };

  const renderConditionInput = (field: any, condition: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'select':
        return (
          <SelectInput
            value={condition.value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </SelectInput>
        );
      case 'number':
        return (
          <NumberInput
            type="number"
            value={condition.value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      default:
        return (
          <TextInput
            type="text"
            value={condition.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label}`}
          />
        );
    }
  };

  const generatePreview = () => {
    const conditions = Object.values(formData.conditions).map((condition: any) => {
      const field = getConditionFields().find(f => f.value === condition.field);
      return `${field?.label || condition.field} ${condition.operator} ${condition.value}`;
    }).join(' AND ');

    const actions = formData.actions.map(action => {
      const actionType = ACTION_TYPES.find(a => a.value === action.type);
      return actionType?.label || action.type;
    }).join(', ');

    return `When ${formData.trigger.replace('_', ' ')} triggers AND ${conditions}, then ${actions}`;
  };

  return (
    <Container className={className}>
      <Header>
        <HeaderLeft>
          <Title>{rule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}</Title>
          <Subtitle>
            Define automated actions based on triggers and conditions
          </Subtitle>
        </HeaderLeft>
        <HeaderActions>
          {onTest && (
            <TestButton onClick={handleTest} disabled={testing || saving}>
              {testing ? <FaSpinner className="spinner" /> : <FaPlay />}
              {testing ? 'Testing...' : 'Test Rule'}
            </TestButton>
          )}
          <CancelButton onClick={onCancel} disabled={saving}>
            <FaTimes />
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={saving}>
            {saving ? <FaSpinner className="spinner" /> : <FaSave />}
            {saving ? 'Saving...' : 'Save Rule'}
          </SaveButton>
        </HeaderActions>
      </Header>

      <Form>
        <FormSection>
          <FormRow>
            <FormGroup>
              <FormLabel>Rule Name *</FormLabel>
              <TextInput
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Auto-flag high-confidence tattoos"
                disabled={saving}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Priority</FormLabel>
              <NumberInput
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                disabled={saving}
              />
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <FormLabel>Description</FormLabel>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of what this rule does"
              disabled={saving}
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <FormLabel>Trigger Event *</FormLabel>
              <SelectInput
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value, conditions: {} })}
                disabled={saving}
              >
                {TRIGGER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </FormGroup>
            <FormGroup>
              <FormCheckbox>
                <input
                  type="checkbox"
                  checked={formData.is_enabled === 1}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked ? 1 : 0 })}
                  disabled={saving}
                />
                <label>Enable Rule</label>
              </FormCheckbox>
            </FormGroup>
          </FormRow>
        </FormSection>

        <Section>
          <SectionHeader onClick={() => toggleSection('conditions')}>
            <SectionTitle>
              <ExpandIcon expanded={expandedSections.conditions}>
                {expandedSections.conditions ? <FaChevronDown /> : <FaChevronRight />}
              </ExpandIcon>
              Conditions
              <SectionCount>({Object.keys(formData.conditions).length})</SectionCount>
            </SectionTitle>
            <AddButton onClick={addCondition} disabled={saving || getConditionFields().length === 0}>
              <FaPlus /> Add Condition
            </AddButton>
          </SectionHeader>

          {expandedSections.conditions && (
            <SectionContent>
              {Object.keys(formData.conditions).length === 0 ? (
                <EmptyState>
                  <EmptyMessage>No conditions defined. Rule will trigger on all {formData.trigger.replace('_', ' ')} events.</EmptyMessage>
                </EmptyState>
              ) : (
                Object.entries(formData.conditions).map(([key, condition]: [string, any]) => {
                  const fields = getConditionFields();
                  const field = fields.find(f => f.value === condition.field);
                  
                  return (
                    <ConditionItem key={key}>
                      <ConditionField>
                        <FormLabel>Field</FormLabel>
                        <SelectInput
                          value={condition.field}
                          onChange={(e) => updateCondition(key, { field: e.target.value, value: '' })}
                          disabled={saving}
                        >
                          <option value="">Select field</option>
                          {fields.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </SelectInput>
                      </ConditionField>
                      
                      <ConditionOperator>
                        <FormLabel>Operator</FormLabel>
                        <SelectInput
                          value={condition.operator}
                          onChange={(e) => updateCondition(key, { operator: e.target.value })}
                          disabled={saving}
                        >
                          <option value="equals">equals</option>
                          <option value="not_equals">not equals</option>
                          <option value="contains">contains</option>
                          <option value="greater_than">greater than</option>
                          <option value="less_than">less than</option>
                        </SelectInput>
                      </ConditionOperator>
                      
                      <ConditionValue>
                        <FormLabel>Value</FormLabel>
                        {field && renderConditionInput(field, condition, (value) => updateCondition(key, { value }))}
                      </ConditionValue>
                      
                      <ConditionActions>
                        <RemoveButton onClick={() => removeCondition(key)} disabled={saving}>
                          <FaTrash />
                        </RemoveButton>
                      </ConditionActions>
                    </ConditionItem>
                  );
                })
              )}
            </SectionContent>
          )}
        </Section>

        <Section>
          <SectionHeader onClick={() => toggleSection('actions')}>
            <SectionTitle>
              <ExpandIcon expanded={expandedSections.actions}>
                {expandedSections.actions ? <FaChevronDown /> : <FaChevronRight />}
              </ExpandIcon>
              Actions
              <SectionCount>({formData.actions.length})</SectionCount>
            </SectionTitle>
            <AddButton onClick={addAction} disabled={saving}>
              <FaPlus /> Add Action
            </AddButton>
          </SectionHeader>

          {expandedSections.actions && (
            <SectionContent>
              {formData.actions.length === 0 ? (
                <EmptyState>
                  <EmptyMessage>No actions defined. Add actions to execute when conditions are met.</EmptyMessage>
                </EmptyState>
              ) : (
                formData.actions.map((action, index) => (
                  <ActionItem key={index}>
                    <ActionField>
                      <FormLabel>Action Type</FormLabel>
                      <SelectInput
                        value={action.type}
                        onChange={(e) => updateAction(index, { type: e.target.value, params: {} })}
                        disabled={saving}
                      >
                        {ACTION_TYPES.map(actionType => (
                          <option key={actionType.value} value={actionType.value}>
                            {actionType.label}
                          </option>
                        ))}
                      </SelectInput>
                      {ACTION_TYPES.find(a => a.value === action.type)?.description && (
                        <ActionDescription>
                          {ACTION_TYPES.find(a => a.value === action.type)?.description}
                        </ActionDescription>
                      )}
                    </ActionField>
                    
                    <ActionActions>
                      <RemoveButton onClick={() => removeAction(index)} disabled={saving}>
                        <FaTrash />
                      </RemoveButton>
                    </ActionActions>
                  </ActionItem>
                ))
              )}
            </SectionContent>
          )}
        </Section>

        <Section>
          <SectionHeader onClick={() => toggleSection('preview')}>
            <SectionTitle>
              <ExpandIcon expanded={expandedSections.preview}>
                {expandedSections.preview ? <FaChevronDown /> : <FaChevronRight />}
              </ExpandIcon>
              Rule Preview
            </SectionTitle>
          </SectionHeader>

          {expandedSections.preview && (
            <SectionContent>
              <PreviewContainer>
                <PreviewText>{generatePreview()}</PreviewText>
              </PreviewContainer>
            </SectionContent>
          )}
        </Section>

        {testResult && (
          <TestResult>
            <TestResultHeader>
              <TestResultTitle>Test Result</TestResultTitle>
            </TestResultHeader>
            <TestResultContent>
              {testResult.error ? (
                <ErrorMessage>{testResult.error}</ErrorMessage>
              ) : (
                <SuccessMessage>Rule test completed successfully!</SuccessMessage>
              )}
              {testResult.details && (
                <TestDetails>{JSON.stringify(testResult.details, null, 2)}</TestDetails>
              )}
            </TestResultContent>
          </TestResult>
        )}
      </Form>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  gap: 2rem;
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const TestButton = styled.button`
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #7c3aed;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CancelButton = styled.button`
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #e5e7eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #047857;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
`;

const Form = styled.div`
  padding: 2rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
`;

const TextInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const NumberInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const SelectInput = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const FormCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;

  input[type="checkbox"] {
    margin: 0;
  }

  label {
    font-size: 0.9rem;
    color: #374151;
    font-weight: 500;
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #1f2937;
`;

const ExpandIcon = styled.div<{ expanded: boolean }>`
  color: #6b7280;
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(0deg)' : 'rotate(-90deg)'};
`;

const SectionCount = styled.span`
  background: #e5e7eb;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const AddButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SectionContent = styled.div`
  padding: 1.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const EmptyMessage = styled.p`
  margin: 0;
  font-size: 0.9rem;
`;

const ConditionItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 1fr auto;
  gap: 1rem;
  align-items: end;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #f8fafc;
`;

const ConditionField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConditionOperator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConditionValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConditionActions = styled.div`
  display: flex;
  align-items: center;
`;

const RemoveButton = styled.button`
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionItem = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #f8fafc;
`;

const ActionField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActionDescription = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const ActionActions = styled.div`
  display: flex;
  align-items: center;
`;

const PreviewContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
`;

const PreviewText = styled.div`
  font-family: monospace;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.5;
`;

const TestResult = styled.div`
  margin-top: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const TestResultHeader = styled.div`
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const TestResultTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const TestResultContent = styled.div`
  padding: 1.5rem;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-weight: 500;
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-weight: 500;
`;

const TestDetails = styled.pre`
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #374151;
  margin-top: 1rem;
  overflow-x: auto;
`;
