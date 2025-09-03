import React from 'react';
import styled from 'styled-components';
import { Activity, Clock } from 'lucide-react';

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 4px;
  border: 1px solid ${props => props.theme.colors.border.primary};
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.sm};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${props => props.theme.colors.accent.primary}05 0%, 
      transparent 50%
    );
    pointer-events: none;
  }
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  background: ${props => props.active 
    ? `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)`
    : 'transparent'
  };
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.active 
    ? props.theme.colors.background.primary 
    : props.theme.colors.text.secondary
  };
  font-weight: ${props => props.active ? '700' : '600'};
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  flex: 1;
  justify-content: center;
  min-height: 48px;
  
  &:hover {
    color: ${props => props.active 
      ? props.theme.colors.background.primary
      : props.theme.colors.accent.primary
    };
    background: ${props => props.active 
      ? `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)`
      : `${props.theme.colors.accent.primary}15`
    };
    transform: ${props => props.active ? 'scale(1.02)' : 'scale(1.01)'};
    box-shadow: ${props => props.active ? props.theme.shadows.glow : props.theme.shadows.sm};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
    font-size: 0.9rem;
    min-height: 44px;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 0.85rem;
    min-height: 40px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const TabBadge = styled.span`
  background: ${props => props.active 
    ? props.theme.colors.background.primary 
    : props.theme.colors.accent.primary
  };
  color: ${props => props.active 
    ? props.theme.colors.accent.primary 
    : props.theme.colors.background.primary
  };
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  border: 1px solid ${props => props.active 
    ? `${props.theme.colors.background.primary}40`
    : 'transparent'
  };
  transition: all 0.3s ease;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.7rem;
    padding: 2px 6px;
    min-width: 18px;
  }
`;

const SportTabs = ({ activeTab, setActiveTab, activeSportsCount, otherSportsCount }) => {
  return (
    <TabsContainer>
      <TabButton
        active={activeTab === 'active'}
        onClick={() => setActiveTab('active')}
      >
        <Activity size={18} />
        Active Sports
        <TabBadge active={activeTab === 'active'}>
          {activeSportsCount}
        </TabBadge>
      </TabButton>
      
      <TabButton
        active={activeTab === 'other'}
        onClick={() => setActiveTab('other')}
      >
        <Clock size={18} />
        Other Sports
        <TabBadge active={activeTab === 'other'}>
          {otherSportsCount}
        </TabBadge>
      </TabButton>
    </TabsContainer>
  );
};

export default SportTabs;