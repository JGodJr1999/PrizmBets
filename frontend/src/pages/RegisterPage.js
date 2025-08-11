import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { validateRegistrationForm, getPasswordStrength, getPasswordStrengthColor } from '../utils/authValidation';
import { useTheme } from 'styled-components';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const RegisterCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const InputGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
  display: block;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  padding-left: 2.5rem;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
    outline: none;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.muted};
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: ${props => props.theme.spacing.sm};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const RegisterButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}, ${props => props.theme.colors.accent.primary}dd);
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.background.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${props => props.theme.spacing.md};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.glow};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LinkText = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.lg};
  
  a {
    color: ${props => props.theme.colors.accent.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const PasswordStrength = styled.div`
  margin-top: ${props => props.theme.spacing.xs};
  font-size: 0.8rem;
  color: ${props => props.color};
  font-weight: 500;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: ${props => props.theme.colors.accent.primary};
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;
  line-height: 1.4;
  
  a {
    color: ${props => props.theme.colors.accent.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    marketingEmails: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Remove local password strength function as we're using the one from utils

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const validationErrors = validateRegistrationForm(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare registration data
    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirm_password: formData.confirmPassword,
      terms_accepted: formData.termsAccepted,
      marketing_emails: formData.marketingEmails
    };
    
    const result = await register(registrationData);
    
    if (result.success) {
      // Redirect to dashboard after successful registration
      navigate('/dashboard', { replace: true });
    }
    // Error handling is done in the AuthContext and shown via toast
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength, theme);

  return (
    <RegisterContainer>
      <RegisterCard>
        <Logo>
          <Brain size={32} />
          SmartBets 2.0
        </Logo>
        
        <Title>Create Account</Title>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="name">Full Name</Label>
            <InputWrapper>
              <InputIcon>
                <User size={20} />
              </InputIcon>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </InputWrapper>
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="email">Email Address</Label>
            <InputWrapper>
              <InputIcon>
                <Mail size={20} />
              </InputIcon>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </InputWrapper>
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <InputWrapper>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputWrapper>
            {formData.password && (
              <PasswordStrength color={passwordStrengthColor}>
                Password strength: {passwordStrength.replace('-', ' ')}
              </PasswordStrength>
            )}
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <InputWrapper>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputWrapper>
            {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
          </InputGroup>
          
          <CheckboxGroup>
            <Checkbox
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <CheckboxLabel htmlFor="termsAccepted">
              I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
            </CheckboxLabel>
          </CheckboxGroup>
          {errors.termsAccepted && <ErrorMessage>{errors.termsAccepted}</ErrorMessage>}
          
          <CheckboxGroup>
            <Checkbox
              id="marketingEmails"
              name="marketingEmails"
              type="checkbox"
              checked={formData.marketingEmails}
              onChange={handleChange}
            />
            <CheckboxLabel htmlFor="marketingEmails">
              Send me product updates and betting tips via email (optional)
            </CheckboxLabel>
          </CheckboxGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <RegisterButton type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </RegisterButton>
        </Form>
        
        <LinkText>
          Already have an account? <Link to="/login">Sign in here</Link>
        </LinkText>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default RegisterPage;