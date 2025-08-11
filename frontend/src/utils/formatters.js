// Utility functions for formatting data in the frontend

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatOdds = (odds) => {
  const numOdds = parseFloat(odds);
  if (isNaN(numOdds)) return '--';
  
  return numOdds > 0 ? `+${numOdds}` : `${numOdds}`;
};

export const formatPercentage = (decimal) => {
  return `${(decimal * 100).toFixed(1)}%`;
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatBetType = (betType) => {
  const typeMap = {
    'moneyline': 'Moneyline',
    'spread': 'Point Spread',
    'over_under': 'Over/Under',
    'prop': 'Prop Bet',
  };
  
  return typeMap[betType] || betType;
};

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};