import React from 'react';
import styled from 'styled-components';
import { Info, DollarSign, Shield, AlertTriangle } from 'lucide-react';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg};
  }
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
`;

const Section = styled.section`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const SectionContent = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.6;
  
  p {
    margin-bottom: ${props => props.theme.spacing.md};
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: ${props => props.theme.colors.text.primary};
  }
  
  ul {
    margin: ${props => props.theme.spacing.sm} 0;
    padding-left: ${props => props.theme.spacing.lg};
  }
  
  li {
    margin-bottom: ${props => props.theme.spacing.xs};
  }
`;

const HighlightBox = styled.div`
  background: ${props => props.theme.colors.accent.primary}20;
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.md} 0;
  color: ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
`;

const ContactInfo = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const AffiliateDisclosurePage = () => {
  return (
    <PageContainer>
      <PageTitle>
        <DollarSign size={32} />
        Affiliate Disclosure
      </PageTitle>
      
      <Section>
        <SectionTitle>
          <Info size={20} />
          Our Commitment to Transparency
        </SectionTitle>
        <SectionContent>
          <p>
            <strong>PrizmBets is committed to full transparency</strong> regarding our business relationships 
            and how we generate revenue to provide you with free and premium sports betting analytics tools.
          </p>
          <p>
            This disclosure explains our current and potential future affiliate relationships, in compliance 
            with Federal Trade Commission (FTC) guidelines and state regulations.
          </p>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>
          <Shield size={20} />
          Current Status: Analytics-Only Platform
        </SectionTitle>
        <SectionContent>
          <p>
            As of the current date, <strong>PrizmBets operates as an independent sports analytics platform</strong> 
            with the following characteristics:
          </p>
          <ul>
            <li>We do NOT accept bets, process wagers, or handle any gambling transactions</li>
            <li>We do NOT currently participate in sportsbook affiliate programs</li>
            <li>All links to sportsbooks are informational homepage links only</li>
            <li>Our revenue comes exclusively from subscription fees ($9.99 Pro, $19.99 Premium)</li>
            <li>We receive NO compensation from any sportsbook for user activity</li>
          </ul>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>
          <AlertTriangle size={20} />
          Future Affiliate Plans
        </SectionTitle>
        <SectionContent>
          <p>
            PrizmBets may, in the future, participate in <strong>Cost Per Acquisition (CPA) affiliate programs</strong> 
            with licensed sportsbooks. If we do so, we will:
          </p>
          <ul>
            <li>Obtain all required licenses in applicable states</li>
            <li>Clearly label all affiliate links with appropriate disclosures</li>
            <li>Update this page with full details of our partnerships</li>
            <li>Maintain editorial independence in our analytical content</li>
            <li>Never compromise our users' best interests for affiliate commissions</li>
          </ul>
          
          <HighlightBox>
            <AlertTriangle size={16} />
            <div>
              <strong>Important:</strong> Any future affiliate relationships will be clearly disclosed. 
              We will never hide our financial interests from our users.
            </div>
          </HighlightBox>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>
          <Info size={20} />
          Our Editorial Independence
        </SectionTitle>
        <SectionContent>
          <p>
            Whether or not we participate in affiliate programs, PrizmBets maintains strict editorial standards:
          </p>
          <ul>
            <li><strong>AI Analysis Integrity:</strong> Our parlay evaluations are based solely on statistical models</li>
            <li><strong>Unbiased Odds Comparison:</strong> We show the best odds regardless of affiliate relationships</li>
            <li><strong>User-First Approach:</strong> Our recommendations are always in your best interest</li>
            <li><strong>Transparent Methodology:</strong> We explain how our analytics work</li>
          </ul>
          <p>
            <strong>Our promise:</strong> No affiliate partnership will ever influence our analytical results 
            or recommendations.
          </p>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>
          <Shield size={20} />
          Legal Compliance
        </SectionTitle>
        <SectionContent>
          <p>
            PrizmBets is committed to full legal compliance in all jurisdictions where we operate:
          </p>
          <ul>
            <li>We comply with all FTC disclosure requirements</li>
            <li>We will obtain required affiliate licenses before participating in any revenue-share programs</li>
            <li>We follow all applicable state regulations regarding sports betting content</li>
            <li>We maintain required disclosures and terms of service</li>
          </ul>
          <p>
            <strong>Age Restriction:</strong> Users must be 21+ to use PrizmBets services in compliance 
            with legal gambling age requirements.
          </p>
        </SectionContent>
      </Section>

      <ContactInfo>
        <p>
          <strong>Questions about our affiliate policies?</strong>
        </p>
        <p>
          Contact us at: <strong>legal@prizmbets.com</strong>
        </p>
        <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '12px' }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </ContactInfo>
    </PageContainer>
  );
};

export default AffiliateDisclosurePage;