import React from 'react';
import styled from 'styled-components';
import { Crown } from 'lucide-react';

const BadgeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  animation: glow 2s ease-in-out infinite alternate;

  @keyframes glow {
    from {
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
    }
    to {
      box-shadow: 0 4px 16px rgba(255, 215, 0, 0.6);
    }
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const MasterUserBadge = () => {
  return (
    <BadgeContainer>
      <Crown size={14} />
      Master User
    </BadgeContainer>
  );
};

export default MasterUserBadge;