import React from 'react';
import styled from 'styled-components';

const LogoContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-1px);
  }
`;

const LogoText = styled.span`
  color: ${props => {
    switch(props.sportsbook) {
      case 'draftkings': return '#ff6b35';
      case 'fanduel': return '#4c9eff';
      case 'betmgm': return '#f0b90b';
      case 'caesars': return '#caa53d';
      case 'betrivers': return '#1e3a8a';
      case 'circa': return '#dc2626';
      default: return props.theme.colors.text.primary;
    }
  }};
`;

const LogoEmoji = styled.span`
  font-size: 1rem;
`;

// For now, we'll use text-based logos with brand colors
// Once we join affiliate programs, we can replace with official logo images
const SportsbookLogo = ({ sportsbook, size = 'small' }) => {
  const getBrandInfo = (book) => {
    switch(book?.toLowerCase()) {
      case 'draftkings':
        return { name: 'DraftKings', emoji: '👑', color: '#ff6b35' };
      case 'fanduel':
        return { name: 'FanDuel', emoji: '🔥', color: '#4c9eff' };
      case 'betmgm':
        return { name: 'BetMGM', emoji: '🦁', color: '#f0b90b' };
      case 'caesars':
        return { name: 'Caesars', emoji: '🏛️', color: '#caa53d' };
      case 'betrivers':
        return { name: 'BetRivers', emoji: '🌊', color: '#1e3a8a' };
      case 'circa':
        return { name: 'Circa Sports', emoji: '🎲', color: '#dc2626' };
      case 'pointsbet':
        return { name: 'PointsBet', emoji: '⚡', color: '#fbbf24' };
      case 'barstool':
        return { name: 'Barstool', emoji: '🪑', color: '#000000' };
      default:
        return { name: book || 'Sportsbook', emoji: '🎯', color: '#666666' };
    }
  };

  const brandInfo = getBrandInfo(sportsbook);

  return (
    <LogoContainer size={size}>
      <LogoEmoji>{brandInfo.emoji}</LogoEmoji>
      <LogoText sportsbook={sportsbook?.toLowerCase()}>
        {brandInfo.name}
      </LogoText>
    </LogoContainer>
  );
};

export default SportsbookLogo;