import React, { useState } from 'react';
import styled from 'styled-components';
import { BarChart3, Lock, Crown, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import UpgradePrompt from '../Upgrade/UpgradePrompt';

const LockedContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
  position: relative;
`;

const DashboardHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const MainTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  background: ${props => props.theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const LockIcon = styled.div`
  color: ${props => props.theme.colors.text.muted};
  background: ${props => props.theme.colors.background.secondary};
  border: 2px solid ${props => props.theme.colors.border.primary};
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  line-height: 1.6;
`;

const PreviewOverlay = styled.div`
  position: relative;
  filter: blur(2px);
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
`;

const LockOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: ${props => props.theme.borderRadius.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const UpgradeCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 212, 170, 0.2);
`;

const UpgradeIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}, ${props => props.theme.colors.accent.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${props => props.theme.spacing.lg};
  color: white;
`;

const UpgradeTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const UpgradeDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  text-align: left;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 1rem;

  svg {
    color: ${props => props.theme.colors.accent.primary};
    flex-shrink: 0;
  }
`;

const UpgradeButton = styled(motion.button)`
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  margin: 0 auto;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.secondary};
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 212, 170, 0.3);
  }
`;

const PlanBadge = styled.div`
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

// Import the actual AITop5Dashboard for preview content
const PreviewSportsContainer = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};
`;

const PreviewSportSection = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  height: 600px; // Fixed height to show some content
  overflow: hidden;
`;

const PreviewSportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
`;

const PreviewSportTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const PreviewBetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const PreviewBetCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  height: 200px;
`;

const PreviewContent = styled.div`
  height: 20px;
  background: ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  margin-bottom: ${props => props.theme.spacing.sm};

  &:nth-child(2) {
    width: 80%;
  }

  &:nth-child(3) {
    width: 60%;
  }
`;

const AITop5Locked = () => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  return (
    <LockedContainer>
      <DashboardHeader>
        <MainTitle>
          <LockIcon>
            <Lock size={20} />
          </LockIcon>
          AI's Top 5
        </MainTitle>
        <PlanBadge>
          <Crown size={12} />
          Pro Feature
        </PlanBadge>
        <Subtitle>
          Our AI's highest probability bets for each sport with detailed analytics and reasoning
        </Subtitle>
      </DashboardHeader>

      <div style={{ position: 'relative' }}>
        <PreviewOverlay>
          <PreviewSportsContainer>
            <PreviewSportSection>
              <PreviewSportHeader>
                <PreviewSportTitle>
                  🏀 NBA
                </PreviewSportTitle>
              </PreviewSportHeader>
              <PreviewBetsGrid>
                {[1, 2, 3].map((i) => (
                  <PreviewBetCard key={i}>
                    <PreviewContent />
                    <PreviewContent />
                    <PreviewContent />
                    <PreviewContent />
                  </PreviewBetCard>
                ))}
              </PreviewBetsGrid>
            </PreviewSportSection>

            <PreviewSportSection>
              <PreviewSportHeader>
                <PreviewSportTitle>
                  🏈 NFL
                </PreviewSportTitle>
              </PreviewSportHeader>
              <PreviewBetsGrid>
                {[1, 2, 3].map((i) => (
                  <PreviewBetCard key={i}>
                    <PreviewContent />
                    <PreviewContent />
                    <PreviewContent />
                    <PreviewContent />
                  </PreviewBetCard>
                ))}
              </PreviewBetsGrid>
            </PreviewSportSection>
          </PreviewSportsContainer>
        </PreviewOverlay>

        <LockOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <UpgradeCard
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <UpgradeIcon>
              <Crown size={32} />
            </UpgradeIcon>

            <UpgradeTitle>Unlock AI's Top 5 Picks</UpgradeTitle>

            <UpgradeDescription>
              Get access to our AI's most confident betting recommendations with detailed analytics,
              reasoning, and best odds comparison across all sportsbooks.
            </UpgradeDescription>

            <FeaturesList>
              <FeatureItem>
                <Star size={16} />
                Top 5 highest probability bets per sport
              </FeatureItem>
              <FeatureItem>
                <BarChart3 size={16} />
                Advanced AI analytics and reasoning
              </FeatureItem>
              <FeatureItem>
                <Crown size={16} />
                Real-time odds comparison
              </FeatureItem>
              <FeatureItem>
                <Star size={16} />
                Historical performance tracking
              </FeatureItem>
              <FeatureItem>
                <BarChart3 size={16} />
                Detailed matchup analysis
              </FeatureItem>
            </FeaturesList>

            <UpgradeButton
              onClick={() => setShowUpgradePrompt(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Crown size={18} />
              Upgrade to Pro
              <ArrowRight size={16} />
            </UpgradeButton>
          </UpgradeCard>
        </LockOverlay>
      </div>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="aiTop5"
        limitReached={true}
        currentUsage={0}
        limit={0}
        resetPeriod="feature"
      />
    </LockedContainer>
  );
};

export default AITop5Locked;