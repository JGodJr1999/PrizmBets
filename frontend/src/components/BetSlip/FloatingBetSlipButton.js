import React from 'react';
import styled from 'styled-components';
import { ChevronUp } from 'lucide-react';

const FloatingButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: 12px 20px;
  border: none;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 999;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-size: 0.9rem;
  min-width: 120px;
  justify-content: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    bottom: 80px; /* Above mobile nav if exists */
    right: 16px;
    padding: 10px 16px;
    font-size: 0.85rem;
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    bottom: 70px;
    right: 12px;
    padding: 8px 14px;
    font-size: 0.8rem;
    min-width: 100px;
  }
`;

const BetCountBadge = styled.span`
  background: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.accent.primary};
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: -4px;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
`;

const BetSlipText = styled.span`
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    display: none;
  }
`;

const FloatingBetSlipButton = ({ betCount, onClick }) => {
  if (betCount === 0) return null;

  return (
    <FloatingButton onClick={onClick}>
      <BetCountBadge>{betCount}</BetCountBadge>
      <BetSlipText>My Bets</BetSlipText>
      <ChevronUp size={20} />
    </FloatingButton>
  );
};

export default FloatingBetSlipButton;