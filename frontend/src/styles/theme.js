export const theme = {
  colors: {
    // Professional black theme with gold accents
    background: {
      primary: '#0a0a0a',      // Pure black
      secondary: '#1a1a1a',    // Dark gray
      tertiary: '#2a2a2a',     // Card background
      card: '#1e1e1e',         // Professional card background
      hover: '#333333'         // Hover state
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      muted: '#888888',
      accent: '#FFD700'        // Gold accent
    },
    accent: {
      primary: '#FFD700',      // Gold primary
      secondary: '#ff6b6b',
      warning: '#FFA500',      // Orange
      success: '#32CD32'       // Lime green
    },
    border: {
      primary: '#333333',
      secondary: '#444444',
      accent: '#FFD700'        // Gold border
    },
    betting: {
      positive: '#32CD32',     // Lime green
      negative: '#ff6b6b',
      neutral: '#FFA500',      // Orange
      high: '#FFD700',         // Gold for high confidence
      medium: '#FFA500',       // Orange for medium
      low: '#ff6b6b'
    },
    status: {
      error: '#ff6b6b',        // Red for errors
      warning: '#FFA500',      // Orange for warnings
      success: '#32CD32',      // Green for success
      info: '#4ECDC4'          // Teal for info
    },
    gradient: {
      primary: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      card: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
      accent: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    stats: {
      excellent: '#FFD700',    // Gold for excellent stats
      good: '#32CD32',         // Lime green for good stats  
      average: '#FFA500',      // Orange for average
      poor: '#ef4444'          // Red for poor stats
    }
  },
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(0, 212, 170, 0.3)'
  }
};