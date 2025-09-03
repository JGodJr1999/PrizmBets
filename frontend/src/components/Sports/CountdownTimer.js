import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Timer } from 'lucide-react';

const CountdownContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.primary}40;
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.border.primary}40;
`;

const CountdownText = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  font-weight: 500;
`;

const TimeUnits = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-left: ${props => props.theme.spacing.xs};
`;

const TimeUnit = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 32px;
`;

const TimeValue = styled.span`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 700;
  font-size: 0.9rem;
`;

const TimeLabel = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CountdownTimer = ({ daysUntil, targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({
        days: daysUntil,
        hours: 0,
        minutes: 0,
        seconds: 0
      });
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, daysUntil]);

  // If more than 30 days away, just show days
  if (timeLeft.days > 30) {
    return (
      <CountdownContainer>
        <CountdownText>
          <Timer size={14} />
          Season starts in {timeLeft.days} days
        </CountdownText>
      </CountdownContainer>
    );
  }

  // If within 30 days, show detailed countdown
  return (
    <CountdownContainer>
      <CountdownText>
        <Timer size={14} />
        Season starts in:
      </CountdownText>
      
      <TimeUnits>
        {timeLeft.days > 0 && (
          <TimeUnit>
            <TimeValue>{timeLeft.days}</TimeValue>
            <TimeLabel>Days</TimeLabel>
          </TimeUnit>
        )}
        
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <TimeUnit>
            <TimeValue>{timeLeft.hours}</TimeValue>
            <TimeLabel>Hrs</TimeLabel>
          </TimeUnit>
        )}
        
        {timeLeft.days === 0 && (
          <>
            <TimeUnit>
              <TimeValue>{timeLeft.minutes}</TimeValue>
              <TimeLabel>Min</TimeLabel>
            </TimeUnit>
            
            <TimeUnit>
              <TimeValue>{timeLeft.seconds}</TimeValue>
              <TimeLabel>Sec</TimeLabel>
            </TimeUnit>
          </>
        )}
      </TimeUnits>
    </CountdownContainer>
  );
};

export default CountdownTimer;