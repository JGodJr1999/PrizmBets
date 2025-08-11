import React from 'react';
import styled from 'styled-components';
import LiveSports from '../components/Sports/LiveSports';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding-top: ${props => props.theme.spacing.lg};
`;

const LiveSportsPage = () => {
  return (
    <PageContainer>
      <LiveSports />
    </PageContainer>
  );
};

export default LiveSportsPage;