import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg, 
    ${props => props.theme.colors.background.card} 0%, 
    ${props => props.theme.colors.border.primary} 50%, 
    ${props => props.theme.colors.background.card} 100%
  );
  background-size: 468px 104px;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: ${props => props.borderRadius || props.theme.borderRadius.md};
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '20px'};
  margin: ${props => props.margin || '0'};
`;

const SkeletonCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const SkeletonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

// Individual skeleton components
export const SkeletonLine = ({ width = '100%', height = '16px', margin = '8px 0', ...props }) => (
  <SkeletonBase width={width} height={height} margin={margin} {...props} />
);

export const SkeletonCircle = ({ size = '40px', margin = '0', ...props }) => (
  <SkeletonBase width={size} height={size} margin={margin} borderRadius="50%" {...props} />
);

export const SkeletonButton = ({ width = '120px', height = '36px', margin = '8px 0', ...props }) => (
  <SkeletonBase width={width} height={height} margin={margin} borderRadius="18px" {...props} />
);

// Complex skeleton components for specific use cases
export const GameCardSkeleton = () => (
  <SkeletonCard>
    {/* Game header */}
    <SkeletonRow>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <SkeletonLine width="80px" height="14px" />
        <SkeletonLine width="120px" height="16px" />
        <SkeletonLine width="20px" height="16px" />
        <SkeletonLine width="120px" height="16px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SkeletonCircle size="16px" />
        <SkeletonLine width="80px" height="14px" />
      </div>
    </SkeletonRow>
    
    {/* Sportsbook odds grid */}
    <SkeletonGrid>
      {[1, 2, 3].map(i => (
        <div key={i}>
          <SkeletonLine width="100px" height="16px" margin="0 0 12px 0" />
          <SkeletonRow>
            <SkeletonLine width="40px" height="14px" />
            <SkeletonLine width="50px" height="16px" />
          </SkeletonRow>
          <SkeletonRow>
            <SkeletonLine width="40px" height="14px" />
            <SkeletonLine width="50px" height="16px" />
          </SkeletonRow>
          <SkeletonButton width="100%" height="32px" margin="12px 0 0 0" />
        </div>
      ))}
    </SkeletonGrid>
  </SkeletonCard>
);

export const LiveScoreCardSkeleton = () => (
  <SkeletonCard>
    {/* Live game header */}
    <SkeletonRow>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SkeletonCircle size="12px" />
        <SkeletonLine width="60px" height="14px" />
      </div>
      <SkeletonLine width="80px" height="14px" />
    </SkeletonRow>
    
    {/* Teams and score */}
    <div style={{ textAlign: 'center', margin: '16px 0' }}>
      <SkeletonRow style={{ justifyContent: 'center', marginBottom: '8px' }}>
        <SkeletonLine width="150px" height="18px" />
        <SkeletonLine width="40px" height="24px" />
        <SkeletonLine width="150px" height="18px" />
      </SkeletonRow>
      <SkeletonLine width="120px" height="14px" margin="0 auto" />
    </div>
    
    {/* Game status */}
    <SkeletonRow style={{ justifyContent: 'center' }}>
      <SkeletonLine width="100px" height="14px" />
    </SkeletonRow>
  </SkeletonCard>
);

export const HeaderSkeleton = () => (
  <SkeletonCard style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 24px auto' }}>
    <SkeletonLine width="300px" height="32px" margin="0 auto 12px auto" />
    <SkeletonLine width="400px" height="16px" margin="0 auto 16px auto" />
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <SkeletonButton width="120px" />
      <SkeletonLine width="150px" height="36px" />
    </div>
  </SkeletonCard>
);

export const SportSelectorSkeleton = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <SkeletonButton key={i} width="100px" height="36px" margin="0" />
    ))}
  </div>
);

// Loading state for the entire page
export const PageLoadingSkeleton = ({ showHeader = true, showSports = true, cardCount = 3 }) => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
    {showHeader && <HeaderSkeleton />}
    {showSports && <SportSelectorSkeleton />}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: cardCount }, (_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Skeleton specifically for live scores page
export const LiveScoresLoadingSkeleton = () => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
    <HeaderSkeleton />
    
    {/* Live games section */}
    <div style={{ marginBottom: '32px' }}>
      <SkeletonLine width="200px" height="24px" margin="0 0 16px 0" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {[1, 2].map(i => <LiveScoreCardSkeleton key={i} />)}
      </div>
    </div>
    
    {/* Starting soon section */}
    <div>
      <SkeletonLine width="150px" height="24px" margin="0 0 16px 0" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {[1, 2, 3].map(i => <LiveScoreCardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

export default SkeletonBase;