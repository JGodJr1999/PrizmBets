import styled, { css } from 'styled-components';

const buttonVariants = {
  primary: css`
    background: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
    border: 1px solid ${props => props.theme.colors.accent.primary};
    
    &:hover:not(:disabled) {
      background: transparent;
      color: ${props => props.theme.colors.accent.primary};
    }
  `,
  
  secondary: css`
    background: transparent;
    color: ${props => props.theme.colors.accent.primary};
    border: 1px solid ${props => props.theme.colors.accent.primary};
    
    &:hover:not(:disabled) {
      background: ${props => props.theme.colors.accent.primary};
      color: ${props => props.theme.colors.background.primary};
    }
  `,
  
  ghost: css`
    background: transparent;
    color: ${props => props.theme.colors.text.secondary};
    border: 1px solid ${props => props.theme.colors.border.primary};
    
    &:hover:not(:disabled) {
      background: ${props => props.theme.colors.background.hover};
      color: ${props => props.theme.colors.text.primary};
      border-color: ${props => props.theme.colors.border.secondary};
    }
  `,
  
  danger: css`
    background: transparent;
    color: ${props => props.theme.colors.accent.secondary};
    border: 1px solid ${props => props.theme.colors.accent.secondary};
    
    &:hover:not(:disabled) {
      background: ${props => props.theme.colors.accent.secondary};
      color: ${props => props.theme.colors.background.primary};
    }
  `
};

const sizeVariants = {
  sm: css`
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    font-size: 0.875rem;
    height: 32px;
  `,
  
  md: css`
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 0.9rem;
    height: 40px;
  `,
  
  lg: css`
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: 1rem;
    height: 48px;
  `
};

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid ${props => props.theme.colors.accent.primary};
    outline-offset: 2px;
  }
  
  ${props => buttonVariants[props.variant || 'primary']}
  ${props => sizeVariants[props.size || 'md']}
`;

export default Button;