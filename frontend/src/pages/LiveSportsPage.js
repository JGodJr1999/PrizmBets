import React from 'react';
import styled from 'styled-components';
import LiveSportsSimple from '../components/Sports/LiveSportsSimple';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding-top: ${props => props.theme.spacing.lg};
`;

const LiveSportsPage = () => {
  return (
    <PageContainer>
      <LiveSportsSimple />
    </PageContainer>
  );
};

export default LiveSportsPage;