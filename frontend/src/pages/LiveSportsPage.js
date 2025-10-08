import React from 'react';
import styled from 'styled-components';
import LiveSportsSimple from '../components/Sports/LiveSportsSimple';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
  padding-top: ${props => props.theme?.spacing?.lg || '1.5rem'};
`;

const LiveSportsPage = () => {
  console.log('LiveSportsPage: Rendering Live Sports page');

  return (
    <PageContainer>
      <ErrorBoundary>
        <LiveSportsSimple />
      </ErrorBoundary>
    </PageContainer>
  );
};

export default LiveSportsPage;