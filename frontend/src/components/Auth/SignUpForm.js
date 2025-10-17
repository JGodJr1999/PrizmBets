import React, { useState } from 'react';
import styled from 'styled-components';
import { Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
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

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.status.error};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const HelperText = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
  font-style: italic;
`;

const SignUpForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { registerWithFirebase, isLoading, error } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 number, 1 special character
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateName = (name) => {
    // At least 2 characters, letters only (with some international support)
    const nameRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]{2,}$/;
    return nameRegex.test(name.trim());
  };

  const validateDisplayName = (displayName) => {
    if (!displayName || displayName.trim() === '') return true; // Optional field
    // 3-20 characters, alphanumeric and some special chars
    const displayNameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return displayNameRegex.test(displayName.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};

    // Required fields
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(firstName)) {
      newErrors.firstName = 'First name must be at least 2 letters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(lastName)) {
      newErrors.lastName = 'Last name must be at least 2 letters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters with 1 number and 1 special character';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Optional display name validation
    if (displayName && !validateDisplayName(displayName)) {
      newErrors.displayName = 'Display name must be 3-20 characters (letters, numbers, _ or -)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await registerWithFirebase(
        email,
        password,
        firstName.trim(),
        lastName.trim(),
        displayName.trim() || null
      );

      if (result.success) {
        toast.success('Account created successfully!');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <Label>
          <User size={18} />
          First Name
        </Label>
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter your first name"
          autoComplete="given-name"
        />
        {errors.firstName && <ErrorMessage><User size={16} />{errors.firstName}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <Label>
          <User size={18} />
          Last Name
        </Label>
        <Input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter your last name"
          autoComplete="family-name"
        />
        {errors.lastName && <ErrorMessage><User size={16} />{errors.lastName}</ErrorMessage>}
      </InputGroup>

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
        {errors.email && <ErrorMessage><Mail size={16} />{errors.email}</ErrorMessage>}
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
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </PasswordToggle>
        </InputWrapper>
        <HelperText>At least 8 characters, 1 number, 1 special character</HelperText>
        {errors.password && <ErrorMessage><Lock size={16} />{errors.password}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <Label>
          <Lock size={18} />
          Confirm Password
        </Label>
        <InputWrapper>
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </PasswordToggle>
        </InputWrapper>
        {errors.confirmPassword && <ErrorMessage><Lock size={16} />{errors.confirmPassword}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <Label>
          <User size={18} />
          Display Name (Optional)
        </Label>
        <Input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Choose how others see you (optional)"
          autoComplete="username"
        />
        <HelperText>Leave blank and we'll create one for you</HelperText>
        {errors.displayName && <ErrorMessage><User size={16} />{errors.displayName}</ErrorMessage>}
      </InputGroup>

      {error && <ErrorMessage><Lock size={16} />{error}</ErrorMessage>}

      <SubmitButton type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <ProfessionalSpinner size="small" showMessage={false} inline />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </SubmitButton>
    </Form>
  );
};

export default SignUpForm;