import React, { useState } from 'react';
import styled from 'styled-components';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ProfessionalSpinner from '../UI/ProfessionalSpinner';

// Form styling matching app's forms exactly
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.accent.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary} 0%, ${props => props.theme.colors.accent.warning} 100%);
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: 16px 24px;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.3s ease;
  margin-top: ${props => props.theme.spacing.md};
  box-shadow: 0 8px 25px ${props => props.theme.colors.accent.primary}30;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px ${props => props.theme.colors.accent.primary}40;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${props => props.theme.colors.accent.primary};
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.status.error};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { loginWithFirebaseEmail, isLoading, error } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await loginWithFirebaseEmail(email, password, rememberMe);
      if (result.success) {
        toast.success('Welcome back!');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <Label>
          <Mail size={18} />
          Email Address
        </Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
        />
        {errors.email && <ErrorMessage><Lock size={16} />{errors.email}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <Label>
          <Lock size={18} />
          Password
        </Label>
        <InputWrapper>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </PasswordToggle>
        </InputWrapper>
        {errors.password && <ErrorMessage><Lock size={16} />{errors.password}</ErrorMessage>}
      </InputGroup>

      <CheckboxRow>
        <Checkbox
          id="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <CheckboxLabel htmlFor="rememberMe">
          Remember me
        </CheckboxLabel>
      </CheckboxRow>

      {error && <ErrorMessage><Lock size={16} />{error}</ErrorMessage>}

      <SubmitButton type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <ProfessionalSpinner size="small" showMessage={false} inline />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </SubmitButton>
    </Form>
  );
};

export default SignInForm;