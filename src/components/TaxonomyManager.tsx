'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaChevronDown, FaChevronRight, FaSpinner } from 'react-icons/fa';

interface TaxonomyItem {
  id: number;
  namespace: string;
  key: string;
  label: string;
  description?: string;
  order: number;
  is_active: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

interface TaxonomyManagerProps {
  namespace: string;
  onUpdate?: () => void;
  className?: string;
}

export const TaxonomyManager: React.FC<TaxonomyManagerProps> = ({
  namespace,
  onUpdate,
  className
}) => {
  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Partial<TaxonomyItem> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTaxonomies();
  }, [namespace]);

  const fetchTaxonomies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/taxonomy/namespace/${namespace}?active_only=false`);
      if (!response.ok) {
        throw new Error('Failed to fetch taxonomies');
      }
      const data = await response.json();
      setTaxonomies(data.taxonomies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch taxonomies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (itemData: Partial<TaxonomyItem>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemData,
          namespace,
          order: taxonomies.length
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create taxonomy item');
      }

      await fetchTaxonomies();
      setNewItem(null);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create taxonomy item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, itemData: Partial<TaxonomyItem>) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/taxonomy/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error('Failed to update taxonomy item');
      }

      await fetchTaxonomies();
      setEditingItem(null);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update taxonomy item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this taxonomy item?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/taxonomy/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete taxonomy item');
      }

      await fetchTaxonomies();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete taxonomy item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: number) => {
    await handleUpdate(id, { is_active: isActive === 1 ? 0 : 1 });
  };

  const sortedTaxonomies = [...taxonomies].sort((a, b) => a.order - b.order);

  return (
    <Container className={className}>
      <Header onClick={() => setExpanded(!expanded)}>
        <HeaderLeft>
          <ExpandIcon expanded={expanded}>
            {expanded ? <FaChevronDown /> : <FaChevronRight />}
          </ExpandIcon>
          <NamespaceTitle>{namespace}</NamespaceTitle>
          <ItemCount>({taxonomies.length} items)</ItemCount>
        </HeaderLeft>
        <HeaderActions>
          <AddButton 
            onClick={(e) => {
              e.stopPropagation();
              setNewItem({ namespace, order: taxonomies.length, is_active: 1 });
            }}
            disabled={saving}
          >
            <FaPlus /> Add Item
          </AddButton>
        </HeaderActions>
      </Header>

      {expanded && (
        <Content>
          {loading ? (
            <LoadingContainer>
              <FaSpinner className="spinner" />
              Loading taxonomies...
            </LoadingContainer>
          ) : error ? (
            <ErrorContainer>
              <ErrorMessage>{error}</ErrorMessage>
              <RetryButton onClick={fetchTaxonomies}>Retry</RetryButton>
            </ErrorContainer>
          ) : (
            <>
              {newItem && (
                <TaxonomyItemEdit
                  item={newItem}
                  onSave={(data) => handleCreate(data)}
                  onCancel={() => setNewItem(null)}
                  saving={saving}
                />
              )}

              {sortedTaxonomies.map((item) => (
                <TaxonomyItemEdit
                  key={item.id}
                  item={item}
                  isEditing={editingItem === item.id}
                  onEdit={() => setEditingItem(item.id)}
                  onSave={(data) => handleUpdate(item.id, data)}
                  onCancel={() => setEditingItem(null)}
                  onDelete={() => handleDelete(item.id)}
                  onToggleActive={() => handleToggleActive(item.id, item.is_active)}
                  saving={saving}
                />
              ))}

              {taxonomies.length === 0 && !newItem && (
                <EmptyState>
                  <EmptyMessage>No taxonomy items found for {namespace}</EmptyMessage>
                  <EmptyAction 
                    onClick={() => setNewItem({ namespace, order: 0, is_active: 1 })}
                  >
                    <FaPlus /> Add First Item
                  </EmptyAction>
                </EmptyState>
              )}
            </>
          )}
        </Content>
      )}
    </Container>
  );
};

interface TaxonomyItemEditProps {
  item: Partial<TaxonomyItem>;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave: (data: Partial<TaxonomyItem>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  saving: boolean;
}

const TaxonomyItemEdit: React.FC<TaxonomyItemEditProps> = ({
  item,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleActive,
  saving
}) => {
  const [formData, setFormData] = useState({
    key: item.key || '',
    label: item.label || '',
    description: item.description || '',
    order: item.order || 0,
    is_active: item.is_active !== undefined ? item.is_active : 1
  });

  const handleSave = () => {
    if (!formData.key.trim() || !formData.label.trim()) {
      return;
    }
    onSave(formData);
  };

  if (!isEditing && item.id) {
    return (
      <ItemContainer active={item.is_active === 1}>
        <ItemContent>
          <ItemLabel>{item.label}</ItemLabel>
          {item.description && <ItemDescription>{item.description}</ItemDescription>}
          <ItemMeta>
            <ItemKey>{item.key}</ItemKey>
            <ItemOrder>#{item.order}</ItemOrder>
          </ItemMeta>
        </ItemContent>
        <ItemActions>
          <ActionButton 
            onClick={onToggleActive}
            active={item.is_active === 1}
            title={item.is_active === 1 ? 'Deactivate' : 'Activate'}
          >
            {item.is_active === 1 ? '●' : '○'}
          </ActionButton>
          <ActionButton onClick={onEdit} title="Edit">
            <FaEdit />
          </ActionButton>
          <ActionButton onClick={onDelete} danger title="Delete">
            <FaTrash />
          </ActionButton>
        </ItemActions>
      </ItemContainer>
    );
  }

  return (
    <EditContainer>
      <EditForm>
        <FormRow>
          <FormGroup>
            <FormLabel>Key *</FormLabel>
            <FormInput
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="unique-key"
              disabled={saving}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Order</FormLabel>
            <FormInput
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              disabled={saving}
            />
          </FormGroup>
        </FormRow>
        <FormGroup>
          <FormLabel>Label *</FormLabel>
          <FormInput
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Display Name"
            disabled={saving}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>Description</FormLabel>
          <FormTextarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            disabled={saving}
          />
        </FormGroup>
        <FormRow>
          <FormCheckbox>
            <input
              type="checkbox"
              checked={formData.is_active === 1}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
              disabled={saving}
            />
            <label>Active</label>
          </FormCheckbox>
        </FormRow>
      </EditForm>
      <EditActions>
        <EditButton onClick={handleSave} primary disabled={saving || !formData.key.trim() || !formData.label.trim()}>
          {saving ? <FaSpinner className="spinner" /> : <FaSave />}
          {item.id ? 'Update' : 'Create'}
        </EditButton>
        <EditButton onClick={onCancel} disabled={saving}>
          <FaTimes />
          Cancel
        </EditButton>
      </EditActions>
    </EditContainer>
  );
};

// Styled Components
const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: white;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ExpandIcon = styled.div<{ expanded: boolean }>`
  color: #6b7280;
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(0deg)' : 'rotate(-90deg)'};
`;

const NamespaceTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`;

const ItemCount = styled.span`
  color: #6b7280;
  font-size: 0.9rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddButton = styled.button`
  background: #1f2937;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #374151;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  padding: 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;

  .spinner {
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
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
  padding: 2rem;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #dc2626;
  margin: 0 0 1rem 0;
`;

const RetryButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
`;

const ItemContainer = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid ${props => props.active ? '#d1d5db' : '#f3f4f6'};
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: ${props => props.active ? 'white' : '#f9fafb'};
  opacity: ${props => props.active ? 1 : 0.7};
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemLabel = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const ItemDescription = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const ItemMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #9ca3af;
`;

const ItemKey = styled.span`
  font-family: monospace;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
`;

const ItemOrder = styled.span``;

const ItemActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const ActionButton = styled.button<{ active?: boolean; danger?: boolean }>`
  background: ${props => {
    if (props.danger) return '#fee2e2';
    if (props.active) return '#d1fae5';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.danger) return '#dc2626';
    if (props.active) return '#059669';
    return '#6b7280';
  }};
  border: none;
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const EditContainer = styled.div`
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f8fafc;
`;

const EditForm = styled.div`
  margin-bottom: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
`;

const FormInput = styled.input`
  padding: 0.5rem;
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

const FormTextarea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 60px;
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

  input[type="checkbox"] {
    margin: 0;
  }

  label {
    font-size: 0.9rem;
    color: #374151;
  }
`;

const EditActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button<{ primary?: boolean }>`
  background: ${props => props.primary ? '#1f2937' : '#f3f4f6'};
  color: ${props => props.primary ? 'white' : '#374151'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.primary ? '#374151' : '#e5e7eb'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

const EmptyMessage = styled.p`
  margin: 0 0 1rem 0;
`;

const EmptyAction = styled.button`
  background: #1f2937;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
`;
