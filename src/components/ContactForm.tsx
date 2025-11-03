'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { FaUser, FaBuilding, FaTag, FaStickyNote } from 'react-icons/fa';

interface Contact {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  source: string;
  lifecycle_stage: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes?: string;
  avatar_url?: string;
  is_active: number;
}

interface ContactTag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface ContactFormProps {
  contact?: Contact;
  onSuccess?: (contact: Contact) => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  hideSubmitButton?: boolean;
  tags?: ContactTag[];
  isModal?: boolean;
}

export interface ContactFormRef {
  submitForm: () => void;
}

export const ContactForm = forwardRef<ContactFormRef, ContactFormProps>(({
  contact,
  onSuccess,
  onSubmittingChange,
  hideSubmitButton = false,
  tags = [],
  isModal = false
}, ref) => {
  const [formData, setFormData] = useState<Contact>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    source: 'website',
    lifecycle_stage: 'lead',
    tags: [],
    custom_fields: {},
    notes: '',
    avatar_url: '',
    is_active: 1,
    ...contact
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<ContactTag[]>(tags);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#96885f');

  const lifecycleStages = [
    { value: 'lead', label: 'Lead' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'advocate', label: 'Advocate' }
  ];

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'social', label: 'Social Media' },
    { value: 'event', label: 'Event' },
    { value: 'import', label: 'Import' },
    { value: 'manual', label: 'Manual Entry' }
  ];

  const tagColors = [
    '#96885f', '#dc3545', '#28a745', '#007bff', '#ffc107', 
    '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'
  ];

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit();
    }
  }));

  useEffect(() => {
    if (onSubmittingChange) {
      onSubmittingChange(isSubmitting);
    }
  }, [isSubmitting, onSubmittingChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = contact?.id ? `/api/contacts/${contact.id}` : '/api/contacts';
      const method = contact?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) {
          onSuccess(data.contact || data);
        }
      } else {
        setErrors({ submit: data.error || 'Failed to save contact' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Contact, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTagAdd = (tagName: string) => {
    if (tagName.trim() && !formData.tags.includes(tagName.trim())) {
      handleInputChange('tags', [...formData.tags, tagName.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/contacts/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTags(prev => [...prev, data.tag]);
        handleTagAdd(newTagName.trim());
        setNewTagName('');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  return (
    <FormWrapper isModal={isModal}>
      <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <FormSection>
          <SectionTitle>
            <FaUser /> Basic Information
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                hasError={!!errors.first_name}
              />
              {errors.first_name && <ErrorMessage>{errors.first_name}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                hasError={!!errors.last_name}
              />
              {errors.last_name && <ErrorMessage>{errors.last_name}</ErrorMessage>}
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                hasError={!!errors.email}
              />
              {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                hasError={!!errors.phone}
              />
              {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FaBuilding /> Company Information
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                type="text"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="Enter job title"
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FaTag /> Contact Classification
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="lifecycle_stage">Lifecycle Stage</Label>
              <Select
                id="lifecycle_stage"
                value={formData.lifecycle_stage}
                onChange={(e) => handleInputChange('lifecycle_stage', e.target.value)}
              >
                {lifecycleStages.map(stage => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="source">Source</Label>
              <Select
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
              >
                {sources.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Tags</Label>
            <TagsContainer>
              {formData.tags.map((tag, index) => {
                const tagData = availableTags.find(t => t.name === tag);
                return (
                  <TagChip key={index} color={tagData?.color || '#96885f'}>
                    {tag}
                    <TagRemoveButton onClick={() => handleTagRemove(tag)}>
                      ×
                    </TagRemoveButton>
                  </TagChip>
                );
              })}
            </TagsContainer>
            
            <TagInputContainer>
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleTagAdd(e.target.value);
                  }
                }}
              >
                <option value="">Add existing tag...</option>
                {availableTags
                  .filter(tag => !formData.tags.includes(tag.name))
                  .map(tag => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
              </Select>
              
              <NewTagContainer>
                <Input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Create new tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNewTag();
                    }
                  }}
                />
                <ColorPickerContainer>
                  {tagColors.map(color => (
                    <ColorOption
                      key={color}
                      color={color}
                      selected={newTagColor === color}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </ColorPickerContainer>
                <Button
                  type="button"
                  onClick={handleCreateNewTag}
                  disabled={!newTagName.trim()}
                >
                  Create Tag
                </Button>
              </NewTagContainer>
            </TagInputContainer>
          </FormGroup>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FaStickyNote /> Additional Information
          </SectionTitle>
          
          <FormGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes about this contact..."
              rows={4}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => handleInputChange('avatar_url', e.target.value)}
              placeholder="Enter avatar image URL"
            />
            {formData.avatar_url && (
              <AvatarPreview>
                <img src={formData.avatar_url} alt="Avatar preview" />
              </AvatarPreview>
            )}
          </FormGroup>
        </FormSection>

        {errors.submit && (
          <ErrorMessage>{errors.submit}</ErrorMessage>
        )}

        {!hideSubmitButton && (
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (contact?.id ? 'Update Contact' : 'Create Contact')}
          </SubmitButton>
        )}
      </Form>
    </FormWrapper>
  );
});

// Set display name for better debugging
ContactForm.displayName = 'ContactForm';

const FormWrapper = styled.div<{ isModal?: boolean }>`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Form = styled.form<{ isModal?: boolean }>`
  background: ${props => props.isModal ? 'transparent' : 'white'};
  border-radius: ${props => props.isModal ? '0' : '12px'};
  padding: ${props => props.isModal ? '0' : '2rem'};
  box-shadow: ${props => props.isModal ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.08)'};
  border: ${props => props.isModal ? 'none' : '1px solid #e9ecef'};
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f8f9fa;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #444;
  font-size: 0.9rem;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.hasError ? '#dc3545' : '#e9ecef'};
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#dc3545' : '#96885f'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(220, 53, 69, 0.1)' : 'rgba(150, 136, 95, 0.1)'};
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background: #7a6f4d;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  min-height: 2rem;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
`;

const TagChip = styled.div<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: ${({ color }) => color}20;
  color: ${({ color }) => color};
  border: 1px solid ${({ color }) => color}40;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
  
  &:hover {
    opacity: 0.7;
  }
`;

const TagInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NewTagContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ColorPickerContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const ColorOption = styled.div<{ color: string; selected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ color }) => color};
  cursor: pointer;
  border: 2px solid ${({ selected }) => selected ? '#333' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #7a6f4d;
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const AvatarPreview = styled.div`
  margin-top: 0.5rem;
  
  img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e9ecef;
  }
`;
