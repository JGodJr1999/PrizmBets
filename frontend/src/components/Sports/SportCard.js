import React from 'react';
import styled from 'styled-components';
import { CheckCircle, Clock, Calendar, Bell } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

const Card = styled.button`
  background: ${props => {
    if (props.isActive) {
      return `linear-gradient(135deg, ${props.theme.colors.accent.primary}15 0%, ${props.theme.colors.accent.primary}08 100%)`;
    }
    return props.theme.colors.background.card;
  }};
  border: 1px solid ${props => props.isActive 
    ? props.theme.colors.accent.primary 
    : props.theme.colors.border.primary
  };
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  text-align: left;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: ${props => props.isActive 
    ? `0 8px 32px ${props.theme.colors.accent.primary}20, ${props.theme.shadows.lg}`
    : props.theme.shadows.sm
  };
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isActive 
      ? `linear-gradient(135deg, ${props.theme.colors.accent.primary}08 0%, transparent 50%)`
      : 'transparent'
    };
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 48px ${props => props.theme.colors.accent.primary}25, ${props => props.theme.shadows.xl};
    border-color: ${props => props.theme.colors.accent.primary};
    
    &::before {
      background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}12 0%, ${props => props.theme.colors.accent.primary}06 100%);
    }
  }
  
  &:active {
    transform: translateY(-2px) scale(1.01);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
      box-shadow: ${props => props.theme.shadows.sm};
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
    
    &:hover {
      transform: translateY(-2px);
    }
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SportName = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.01em;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.1rem;
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: 6px 10px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  background: ${props => {
    if (props.status === 'active') return `linear-gradient(135deg, ${props.theme.colors.betting.positive}, ${props.theme.colors.betting.positive}dd)`;
    if (props.status === 'preseason') return `linear-gradient(135deg, ${props.theme.colors.betting.neutral}, ${props.theme.colors.betting.neutral}dd)`;
    return `linear-gradient(135deg, ${props.theme.colors.text.muted}, ${props.theme.colors.text.muted}dd)`;
  }};
  color: ${props => props.theme.colors.background.primary};
  box-shadow: 0 2px 8px ${props => {
    if (props.status === 'active') return `${props.theme.colors.betting.positive}40`;
    if (props.status === 'preseason') return `${props.theme.colors.betting.neutral}40`;
    return `${props.theme.colors.text.muted}40`;
  }};
  transition: all 0.3s ease;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const StatusText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
`;

const ActionArea = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.sm};
`;

const NextSeasonInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
`;

const NotifyButton = styled.button`
  background: ${props => props.theme.colors.accent.primary}20;
  color: ${props => props.theme.colors.accent.primary};
  border: 1px solid ${props => props.theme.colors.accent.primary}40;
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary}30;
  }
`;

const SportCard = ({ 
  sport, 
  isActive, 
  seasonStatus, 
  seasonMessage, 
  nextSeasonStart, 
  onClick, 
  disabled = false 
}) => {
  const handleNotifyClick = (e) => {
    e.stopPropagation();
    // TODO: Implement notification signup
    console.log(`Notify requested for ${sport.name}`);
  };

  const renderStatusBadge = () => {
    if (isActive) {
      return (
        <StatusBadge status="active">
          <CheckCircle size={12} />
          Live
        </StatusBadge>
      );
    }
    
    if (seasonStatus === 'preseason') {
      return (
        <StatusBadge status="preseason">
          <Calendar size={12} />
          Preseason
        </StatusBadge>
      );
    }
    
    return (
      <StatusBadge status="offseason">
        <Clock size={12} />
        Off-Season
      </StatusBadge>
    );
  };

  return (
    <Card 
      isActive={isActive} 
      onClick={onClick}
      disabled={disabled}
    >
      <CardHeader>
        <SportName>{sport.name}</SportName>
        {renderStatusBadge()}
      </CardHeader>
      
      <CardContent>
        {isActive ? (
          <StatusText>
            Live odds and games available now
          </StatusText>
        ) : (
          <>
            <StatusText>
              {seasonMessage?.description || 'Season currently inactive'}
            </StatusText>
            
            {nextSeasonStart && (
              <ActionArea>
                <NextSeasonInfo>
                  <Calendar size={14} />
                  <span>Returns: {nextSeasonStart.date}</span>
                </NextSeasonInfo>
                
                <NotifyButton onClick={handleNotifyClick}>
                  <Bell size={10} />
                  Notify Me
                </NotifyButton>
              </ActionArea>
            )}
            
            {nextSeasonStart?.days_until && (
              <CountdownTimer 
                daysUntil={nextSeasonStart.days_until}
                targetDate={nextSeasonStart.iso_date}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SportCard;