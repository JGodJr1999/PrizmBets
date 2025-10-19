import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AgentProvider } from './contexts/AgentContext';
import { RecaptchaProvider } from './contexts/RecaptchaContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { PageLoadingSkeleton } from './components/UI/SkeletonLoader';
import AuthScreen from './components/Auth/AuthScreen';
import FloatingBetSlipButton from './components/BetSlip/FloatingBetSlipButton';
import SlidingBetSlip from './components/BetSlip/SlidingBetSlip';
import { useBetSlip } from './hooks/useBetSlip';

// Critical components no longer needed at app level due to authentication gate

// Lazy load non-critical pages for better performance
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
const LiveSportsPage = React.lazy(() => import('./pages/LiveSportsPage'));
const PickEmPageDemo = React.lazy(() => import('./pages/PickEmPageDemo'));
const PoolDetailPage = React.lazy(() => import('./pages/PoolDetailPage'));
const FantasyComingSoonPage = React.lazy(() => import('./pages/FantasyComingSoonPage'));
const SportsProjectionsPage = React.lazy(() => import('./pages/SportsProjectionsPage'));
const LiveScoresPage = React.lazy(() => import('./pages/LiveScoresPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const AccountPage = React.lazy(() => import('./pages/AccountPage'));
const BettingHubPage = React.lazy(() => import('./pages/BettingHubPage'));
const AffiliateDisclosurePage = React.lazy(() => import('./pages/AffiliateDisclosurePage'));
const TestLiveData = React.lazy(() => import('./pages/TestLiveData'));
const AgentDashboardPage = React.lazy(() => import('./pages/AgentDashboardPage'));
const MyBetsPage = React.lazy(() => import('./pages/MyBetsPage'));
const AdminManagementPage = React.lazy(() => import('./pages/AdminManagementPage'));
const AdminInvitePage = React.lazy(() => import('./pages/AdminInvitePage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/AdminAnalyticsPage'));

// MainContent wrapper to account for fixed header
const MainContent = styled.main`
  margin-top: 80px; /* Account for fixed header height */
  min-height: calc(100vh - 80px);

  @media (max-width: 968px) {
    margin-top: 70px; /* Smaller margin on mobile */
    min-height: calc(100vh - 70px);
  }
`;

// Authentication gate now handles all routing - no need for separate ProtectedRoute/PublicRoute components

// Main App component with Authentication Gate
const AppContent = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { bets, addBet, updateBetStatus } = useBetSlip();
  const [betSlipOpen, setBetSlipOpen] = useState(false);

  // Auto-open bet slip when new bet is added
  const handleAddBet = async (betData) => {
    try {
      await addBet(betData);
      setBetSlipOpen(true); // Auto-open slip
    } catch (error) {
      console.error('Failed to add bet:', error);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If user is not authenticated, show auth screen
  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // User is authenticated, show main app
  return (
    <>
      <Header user={user} onLogout={logout} />
      <MainContent>
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
            {/* Default route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* All routes now require authentication */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/betting-hub" element={<BettingHubPage />} />
            <Route path="/my-bets" element={<MyBetsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/live-sports" element={<LiveSportsPage />} />
            <Route path="/projections" element={<SportsProjectionsPage />} />
            <Route path="/pick-em" element={<PickEmPageDemo />} />
            <Route path="/pick-em/pool/:poolId" element={<PoolDetailPage />} />
            <Route path="/fantasy-coming-soon" element={<FantasyComingSoonPage />} />
            <Route path="/live-scores" element={<LiveScoresPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin-management" element={<AdminManagementPage />} />
            <Route path="/admin-invite" element={<AdminInvitePage />} />
            <Route path="/admin-analytics" element={<AdminAnalyticsPage />} />
            <Route path="/agents" element={<AgentDashboardPage />} />
            <Route path="/affiliate-disclosure" element={<AffiliateDisclosurePage />} />
            <Route path="/test-live-data" element={<TestLiveData />} />

            {/* Redirect legacy routes */}
            <Route path="/parlay" element={<Navigate to="/live-sports" replace />} />
            <Route path="/analytics" element={<Navigate to="/betting-hub" replace />} />
            <Route path="/betting-data" element={<Navigate to="/betting-hub" replace />} />
            <Route path="/bet-tracking" element={<Navigate to="/betting-hub" replace />} />

            {/* Legacy auth routes - redirect to dashboard since user is already authenticated */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </MainContent>
      <Footer />

      {/* Floating bet slip button - only show if user has bets */}
      <FloatingBetSlipButton
        betCount={bets.length}
        onClick={() => setBetSlipOpen(true)}
      />

      {/* Sliding bet slip panel */}
      <SlidingBetSlip
        isOpen={betSlipOpen}
        onClose={() => setBetSlipOpen(false)}
        bets={bets}
        onUpdateBetStatus={updateBetStatus}
        onAddBet={() => {
          setBetSlipOpen(false);
          // Navigate to my-bets page to add new bet
          window.location.href = '/my-bets';
        }}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.colors.background.card,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border.primary}`,
          },
        }}
      />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <RecaptchaProvider>
          <Router>
            <AuthProvider>
              <AgentProvider>
                <AppContent />
              </AgentProvider>
            </AuthProvider>
          </Router>
        </RecaptchaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;