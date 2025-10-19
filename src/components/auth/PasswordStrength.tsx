'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

interface PasswordStrengthProps {
  password: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
  { label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Contains number', test: (pwd) => /\d/.test(pwd) },
  { label: 'Contains special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
];

const getStrengthLevel = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
  const passedRequirements = requirements.filter(req => req.test(password)).length;
  
  if (passedRequirements < 2) return 'weak';
  if (passedRequirements < 3) return 'fair';
  if (passedRequirements < 4) return 'good';
  return 'strong';
};

const getStrengthColor = (level: string) => {
  switch (level) {
    case 'weak': return '#ef4444';
    case 'fair': return '#f59e0b';
    case 'good': return '#3b82f6';
    case 'strong': return '#10b981';
    default: return '#e5e7eb';
  }
};

const getStrengthText = (level: string) => {
  switch (level) {
    case 'weak': return 'Weak';
    case 'fair': return 'Fair';
    case 'good': return 'Good';
    case 'strong': return 'Strong';
    default: return '';
  }
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showPassword,
  onToggleShowPassword,
  className
}) => {
  const [strengthLevel, setStrengthLevel] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');

  useEffect(() => {
    setStrengthLevel(getStrengthLevel(password));
  }, [password]);

  const passedRequirements = requirements.filter(req => req.test(password));
  const strengthPercentage = (passedRequirements.length / requirements.length) * 100;

  return (
    <Container className={className}>
      <PasswordToggleContainer>
        <PasswordToggleButton
          type="button"
          onClick={onToggleShowPassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </PasswordToggleButton>
      </PasswordToggleContainer>

      {password && (
        <StrengthContainer>
          <StrengthHeader>
            <StrengthLabel>Password Strength:</StrengthLabel>
            <StrengthText color={getStrengthColor(strengthLevel)}>
              {getStrengthText(strengthLevel)}
            </StrengthText>
          </StrengthHeader>
          
          <StrengthBar>
            <StrengthFill
              width={strengthPercentage}
              color={getStrengthColor(strengthLevel)}
            />
          </StrengthBar>
          
          <RequirementsList>
            {requirements.map((requirement, index) => {
              const passed = requirement.test(password);
              return (
                <RequirementItem key={index} passed={passed}>
                  {passed ? (
                    <FaCheck className="check-icon" />
                  ) : (
                    <FaTimes className="times-icon" />
                  )}
                  <span>{requirement.label}</span>
                </RequirementItem>
              );
            })}
          </RequirementsList>
          
          {password && strengthLevel === 'weak' && (
            <StrengthHint>
              💡 Try adding uppercase letters, numbers, or special characters to make your password stronger.
            </StrengthHint>
          )}
        </StrengthContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const PasswordToggleContainer = styled.div`
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  z-index: 2;
`;

const PasswordToggleButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s ease;
  
  &:hover {
    color: #333;
  }
  
  &:focus {
    outline: none;
    color: #96885f;
  }
`;

const StrengthContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const StrengthHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const StrengthLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`;

const StrengthText = styled.span<{ color: string }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.color};
`;

const StrengthBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const StrengthFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => props.color};
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
`;

const RequirementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RequirementItem = styled.div<{ passed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${props => props.passed ? '#10b981' : '#6b7280'};
  
  .check-icon {
    color: #10b981;
    font-size: 0.75rem;
  }
  
  .times-icon {
    color: #6b7280;
    font-size: 0.75rem;
  }
`;

const StrengthHint = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #92400e;
  line-height: 1.4;
`;
