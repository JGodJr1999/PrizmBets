import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, Shield, Info } from 'lucide-react';

const FooterContainer = styled.footer`
  background: ${props => props.theme.colors.background.secondary};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.xxl};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const DisclaimerSection = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
`;

const DisclaimerTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const DisclaimerText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const LegalLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const LegalLink = styled.a`
  color: ${props => props.theme.colors.text.secondary};
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const ResponsibleGambling = styled.div`
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: center;
  margin-top: ${props => props.theme.spacing.lg};
`;

const Copyright = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.lg};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <DisclaimerSection>
          <DisclaimerTitle>
            <AlertTriangle size={20} />
            Important Disclaimer
          </DisclaimerTitle>
          <DisclaimerText>
            <strong>PrizmBets is an independent sports analytics platform.</strong> We do not accept bets, 
            process wagers, or handle any gambling transactions. All betting must be done directly 
            through licensed sportsbooks.
          </DisclaimerText>
          <DisclaimerText>
            Our analysis and odds comparison are for informational purposes only and do not 
            guarantee any outcomes. We are not affiliated with any sportsbook mentioned on our platform.
          </DisclaimerText>
        </DisclaimerSection>
        
        <DisclaimerSection>
          <DisclaimerTitle>
            <Shield size={20} />
            Legal & Privacy
          </DisclaimerTitle>
          <LegalLinks>
            <LegalLink href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </LegalLink>
            <LegalLink href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </LegalLink>
            <LegalLink href="/affiliate-disclosure" target="_blank" rel="noopener noreferrer">
              Affiliate Disclosure
            </LegalLink>
            <LegalLink href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer">
              Problem Gambling Resources
            </LegalLink>
            <LegalLink href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer">
              Gamblers Anonymous
            </LegalLink>
          </LegalLinks>
        </DisclaimerSection>
      </FooterContent>
      
      <ResponsibleGambling>
        <DisclaimerTitle style={{ color: 'white', justifyContent: 'center', margin: '0 0 8px 0' }}>
          <Info size={20} />
          Please Gamble Responsibly
        </DisclaimerTitle>
        <DisclaimerText style={{ color: 'white', margin: 0 }}>
          Must be 21+ to place bets. If you or someone you know has a gambling problem, 
          call 1-800-GAMBLER or visit ncpgambling.org for help.
        </DisclaimerText>
      </ResponsibleGambling>
      
      <Copyright>
        © 2025 PrizmBets. All rights reserved. PrizmBets is not a gambling operator and does not facilitate betting.
      </Copyright>
    </FooterContainer>
  );
};

export default Footer;