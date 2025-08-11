import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Calendar, Clock, Info } from 'lucide-react';

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  min-height: 400px;
  background: linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%);
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const SportIcon = styled.div`
  width: 120px;
  height: 120px;
  margin-bottom: ${props => props.theme.spacing.lg};
  opacity: 0.7;
  animation: ${floatAnimation} 3s ease-in-out infinite;
  
  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 4px 8px rgba(0, 212, 170, 0.3));
  }
`;

const EmptyTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const EmptyMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  max-width: 400px;
  line-height: 1.5;
`;

const ScheduleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background: rgba(0, 212, 170, 0.05);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: ${props => props.theme.borderRadius.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const ScheduleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const ScheduleText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  text-align: center;
`;

const sportConfig = {
  nfl: {
    title: "No NFL games available",
    message: "NFL games are typically played on Sundays, Mondays, and Thursdays during the season (September - February).",
    schedule: "Games usually start at 1:00 PM, 4:25 PM, and 8:20 PM ET",
    icon: "/images/sports/football.svg"
  },
  nba: {
    title: "No NBA games available", 
    message: "NBA games are played regularly throughout the week during the season (October - June).",
    schedule: "Games typically start between 7:00 PM - 10:30 PM ET",
    icon: "/images/sports/basketball.svg"
  },
  wnba: {
    title: "No WNBA games available",
    message: "WNBA games are played during the summer season (May - September).",
    schedule: "Games typically start between 7:00 PM - 8:00 PM ET",
    icon: "/images/sports/basketball.svg"
  },
  mlb: {
    title: "No MLB games available",
    message: "MLB games are played daily during the season (March - October).",
    schedule: "Games typically start at 1:00 PM, 7:00 PM, or 8:00 PM ET",
    icon: "/images/sports/baseball.svg"
  },
  nhl: {
    title: "No NHL games available",
    message: "NHL games are played regularly during the season (October - June).",
    schedule: "Games typically start between 7:00 PM - 10:00 PM ET",
    icon: "/images/sports/hockey.svg"
  },
  ncaaf: {
    title: "No NCAA Football games available",
    message: "College football games are played primarily on Saturdays during the season (August - January).",
    schedule: "Games typically start at 12:00 PM, 3:30 PM, 7:00 PM, and 10:30 PM ET",
    icon: "/images/sports/football.svg"
  },
  ncaab: {
    title: "No NCAA Basketball games available",
    message: "College basketball games are played throughout the week during the season (November - March).",
    schedule: "Games typically start between 6:00 PM - 9:00 PM ET",
    icon: "/images/sports/basketball.svg"
  },
  soccer: {
    title: "No Soccer games available",
    message: "Premier League and major soccer leagues play on weekends and weekdays.",
    schedule: "Games typically start at 10:00 AM, 12:30 PM, and 3:00 PM ET on weekends",
    icon: "/images/sports/soccer.svg"
  },
  mma: {
    title: "No MMA events available",
    message: "UFC and major MMA events are typically held on Saturday nights.",
    schedule: "Main events usually start around 10:00 PM ET",
    icon: "/images/sports/mma.svg"
  },
  tennis: {
    title: "No Tennis matches available",
    message: "Tennis tournaments run throughout the year with major events having daily matches.",
    schedule: "Matches can start anytime from 11:00 AM - 7:00 PM ET depending on tournament",
    icon: "/images/sports/tennis.svg"
  },
  golf: {
    title: "No Golf tournaments available",
    message: "PGA Tour events typically run Thursday through Sunday.",
    schedule: "Coverage usually starts around 2:00 PM ET on weekdays, 1:00 PM ET on weekends",
    icon: "/images/sports/golf.svg"
  },
  all: {
    title: "No live games available",
    message: "There are currently no live games scheduled across any sports. Check back during peak sports seasons for live betting opportunities.",
    schedule: "Sports seasons vary - check individual sport tabs for typical game times",
    icon: "/images/sports/football.svg"
  }
};

const EmptySportState = ({ sport = 'all', showSchedule = true }) => {
  const config = sportConfig[sport] || sportConfig.all;
  
  return (
    <EmptyContainer>
      <SportIcon>
        <img src={config.icon} alt={`${sport} icon`} />
      </SportIcon>
      
      <EmptyTitle>{config.title}</EmptyTitle>
      <EmptyMessage>{config.message}</EmptyMessage>
      
      {showSchedule && (
        <ScheduleInfo>
          <ScheduleTitle>
            <Clock size={16} />
            Typical Schedule
          </ScheduleTitle>
          <ScheduleText>{config.schedule}</ScheduleText>
        </ScheduleInfo>
      )}
      
      <ScheduleInfo style={{ marginTop: '1rem' }}>
        <ScheduleTitle>
          <Info size={16} />
          What's Next?
        </ScheduleTitle>
        <ScheduleText>
          Live games will appear here automatically when they start. 
          Check back during game times for live odds and betting opportunities.
        </ScheduleText>
      </ScheduleInfo>
    </EmptyContainer>
  );
};

export default EmptySportState;