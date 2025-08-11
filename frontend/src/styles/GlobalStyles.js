import { createGlobalStyle, keyframes } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
    line-height: 1.6;
    overflow-x: hidden;
    position: relative;
    min-height: 100vh;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(0, 212, 170, 0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }


  #root {
    min-height: 100vh;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.secondary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.accent.primary};
  }

  /* Selection styles */
  ::selection {
    background-color: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
  }

  /* Focus styles */
  button:focus,
  input:focus,
  textarea:focus {
    outline: 2px solid ${props => props.theme.colors.accent.primary};
    outline-offset: 2px;
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .slide-in {
    animation: slideIn 0.3s ease-out;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  /* Minimal card styling */
  .card-minimal {
    background: ${props => props.theme.colors.background.card};
    border: 1px solid ${props => props.theme.colors.border.primary};
    border-radius: ${props => props.theme.borderRadius.lg};
    transition: all 0.2s ease;
  }

  .card-minimal:hover {
    border-color: ${props => props.theme.colors.border.secondary};
    box-shadow: ${props => props.theme.shadows.sm};
  }

  /* Clean glass effect */
  .glass-minimal {
    background: rgba(30, 30, 30, 0.6);
    backdrop-filter: blur(8px);
    border: 1px solid ${props => props.theme.colors.border.primary};
  }

  /* Mobile-specific enhancements */
  @media (max-width: 768px) {
    /* Prevent zoom on input focus (iOS Safari) */
    input[type="text"],
    input[type="number"],
    input[type="email"],
    input[type="password"],
    textarea,
    select {
      font-size: 16px !important;
    }
    
    /* Better touch scrolling */
    body {
      -webkit-overflow-scrolling: touch;
    }
    
    /* Prevent horizontal scroll */
    body, html {
      overflow-x: hidden;
      width: 100%;
    }
    
    /* Improved tap targets */
    button, .clickable {
      min-height: 44px;
      min-width: 44px;
    }
    
    /* Better focus visibility on mobile */
    *:focus {
      outline: 2px solid ${props => props.theme.colors.accent.primary};
      outline-offset: 2px;
    }
  }

  /* Tablet-specific adjustments */
  @media (min-width: 769px) and (max-width: 1024px) {
    /* Optimize for tablet landscape/portrait */
    body {
      font-size: 1rem;
    }
  }

  /* High DPI display adjustments */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    /* Crisp borders on retina displays */
    .card-minimal {
      border-width: 0.5px;
    }
  }

  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Dark mode preference support */
  @media (prefers-color-scheme: dark) {
    /* Already using dark theme, but this ensures consistency */
    :root {
      color-scheme: dark;
    }
  }
`;