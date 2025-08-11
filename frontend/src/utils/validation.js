// Frontend validation utilities

export const validateBetAmount = (amount) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return 'Amount must be a valid number';
  }
  
  if (numAmount <= 0) {
    return 'Amount must be greater than 0';
  }
  
  if (numAmount > 10000) {
    return 'Amount cannot exceed $10,000';
  }
  
  return null; // Valid
};

export const validateOdds = (odds) => {
  const numOdds = parseFloat(odds);
  
  if (isNaN(numOdds)) {
    return 'Odds must be a valid number';
  }
  
  if (numOdds < -10000 || numOdds > 10000) {
    return 'Odds must be between -10000 and +10000';
  }
  
  if (numOdds === 0) {
    return 'Odds cannot be zero';
  }
  
  return null; // Valid
};

export const validateTeamName = (teamName) => {
  if (!teamName || teamName.trim().length === 0) {
    return 'Team name is required';
  }
  
  if (teamName.trim().length > 100) {
    return 'Team name cannot exceed 100 characters';
  }
  
  // Check for potentially dangerous characters
  const dangerousChars = /[<>\"'();]/;
  if (dangerousChars.test(teamName)) {
    return 'Team name contains invalid characters';
  }
  
  return null; // Valid
};

export const validateParlaySize = (bets) => {
  if (!Array.isArray(bets) || bets.length === 0) {
    return 'At least one bet is required';
  }
  
  if (bets.length > 10) {
    return 'Maximum 10 bets allowed per parlay';
  }
  
  return null; // Valid
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input.replace(/[<>\"'();]/g, '').trim();
};