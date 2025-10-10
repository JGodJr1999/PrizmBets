// Authentication-related validation utilities

// Email validation
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
    return errors;
  }
  
  if (typeof email !== 'string') {
    errors.push('Email must be a string');
    return errors;
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    errors.push('Email cannot be empty');
    return errors;
  }
  
  if (trimmedEmail.length > 255) {
    errors.push('Email is too long (maximum 255 characters)');
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }
  
  // Check for common email issues
  if (trimmedEmail.includes('..')) {
    errors.push('Email cannot contain consecutive dots');
  }
  
  if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
    errors.push('Email cannot start or end with a dot');
  }
  
  return errors;
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return errors;
  }

  if (typeof password !== 'string') {
    errors.push('Password must be a string');
    return errors;
  }

  // Use the enhanced validation function
  const validation = validatePasswordRequirements(password);

  if (!validation.requirements.length.met) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!validation.requirements.number.met) {
    errors.push('Password must contain at least one number');
  }

  if (!validation.requirements.special.met) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  if (password.length > 128) {
    errors.push('Password is too long (maximum 128 characters)');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '123456', 'qwerty', 'abc123',
    'letmein', 'welcome123', 'admin123', 'password1', '12345678'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  // Check for sequential or repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain more than 2 consecutive identical characters');
  }

  return errors;
};

// Name validation
export const validateName = (name) => {
  const errors = [];
  
  if (!name) {
    errors.push('Name is required');
    return errors;
  }
  
  if (typeof name !== 'string') {
    errors.push('Name must be a string');
    return errors;
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    errors.push('Name cannot be empty');
    return errors;
  }
  
  if (trimmedName.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (trimmedName.length > 100) {
    errors.push('Name is too long (maximum 100 characters)');
  }
  
  // Check for invalid characters (only letters, spaces, hyphens, and apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }
  
  // Check for excessive whitespace
  if (trimmedName.includes('  ')) {
    errors.push('Name cannot contain multiple consecutive spaces');
  }
  
  return errors;
};

// Password confirmation validation
export const validatePasswordConfirmation = (password, confirmPassword) => {
  const errors = [];
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required');
    return errors;
  }
  
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return errors;
};

// Terms acceptance validation
export const validateTermsAccepted = (termsAccepted) => {
  const errors = [];
  
  if (!termsAccepted) {
    errors.push('You must accept the Terms of Service and Privacy Policy to continue');
  }
  
  return errors;
};

// Enhanced password requirements validation for real-time feedback
export const validatePasswordRequirements = (password) => {
  const requirements = {
    length: {
      met: password.length >= 8,
      text: 'At least 8 characters',
      required: true
    },
    number: {
      met: /\d/.test(password),
      text: 'Contains a number',
      required: true
    },
    special: {
      met: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
      text: 'Contains a special character',
      required: true
    },
    uppercase: {
      met: /[A-Z]/.test(password),
      text: 'Contains uppercase letter',
      required: false // Optional but recommended
    },
    lowercase: {
      met: /[a-z]/.test(password),
      text: 'Contains lowercase letter',
      required: false // Optional but recommended
    }
  };

  const requiredMet = requirements.length.met && requirements.number.met && requirements.special.met;
  const allMet = Object.values(requirements).every(req => req.met);

  return {
    requirements,
    requiredMet,
    allMet,
    score: Object.values(requirements).filter(req => req.met).length
  };
};

// Get password strength
export const getPasswordStrength = (password) => {
  if (!password) return 'none';

  const validation = validatePasswordRequirements(password);
  const { score, requiredMet, allMet } = validation;

  if (!requiredMet) return 'weak';
  if (score >= 3 && score < 4) return 'medium';
  if (score >= 4 && allMet) return 'strong';
  return 'medium';
};

// Get password strength color
export const getPasswordStrengthColor = (strength, theme) => {
  switch (strength) {
    case 'weak':
      return theme.colors.accent.secondary;
    case 'medium':
      return theme.colors.betting.neutral || '#FFA500';
    case 'strong':
      return theme.colors.betting.positive || '#22C55E';
    case 'very-strong':
      return theme.colors.accent.primary;
    default:
      return theme.colors.text.muted;
  }
};

// Check if password meets minimum requirements for form submission
export const isPasswordValid = (password) => {
  if (!password) return false;
  const validation = validatePasswordRequirements(password);
  return validation.requiredMet;
};

// Get password border color based on validation
export const getPasswordBorderColor = (password, theme) => {
  if (!password) return theme.colors.border.secondary;

  const validation = validatePasswordRequirements(password);
  if (validation.requiredMet) {
    return theme.colors.betting.positive || '#22C55E';
  }
  return theme.colors.accent.secondary || '#EF4444';
};

// Comprehensive form validation
export const validateRegistrationForm = (formData) => {
  const errors = {};
  
  // Validate name
  const nameErrors = validateName(formData.name);
  if (nameErrors.length > 0) {
    errors.name = nameErrors[0]; // Show first error
  }
  
  // Validate email
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0]; // Show first error
  }
  
  // Validate password
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors[0]; // Show first error
  }
  
  // Validate password confirmation
  const confirmPasswordErrors = validatePasswordConfirmation(formData.password, formData.confirmPassword);
  if (confirmPasswordErrors.length > 0) {
    errors.confirmPassword = confirmPasswordErrors[0]; // Show first error
  }
  
  // Validate terms acceptance
  const termsErrors = validateTermsAccepted(formData.termsAccepted);
  if (termsErrors.length > 0) {
    errors.termsAccepted = termsErrors[0]; // Show first error
  }
  
  return errors;
};

export const validateLoginForm = (formData) => {
  const errors = {};
  
  // Validate email
  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0]; // Show first error
  }
  
  // Validate password (simpler validation for login)
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 1) {
    errors.password = 'Password cannot be empty';
  }
  
  return errors;
};