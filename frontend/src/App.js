import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Critical components loaded immediately
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy load non-critical pages for better performance
const ParlayPage = React.lazy(() => import('./pages/ParlayPage'));
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

// MainContent wrapper to account for fixed header
const MainContent = styled.main`
  margin-top: 80px; /* Account for fixed header height */
  min-height: calc(100vh - 80px);

  @media (max-width: 968px) {
    margin-top: 70px; /* Smaller margin on mobile */
    min-height: calc(100vh - 70px);
  }
`;

// ProtectedRoute component to handle authentication-required pages
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// PublicRoute component to handle login/register pages when user is authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App component with AuthProvider
const AppContent = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Header user={user} onLogout={logout} />
      <MainContent>
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/betting-hub" 
            element={
              <ProtectedRoute>
                <BettingHubPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/parlay"
            element={<Navigate to="/live-sports" replace />}
          />
          <Route 
            path="/test-live-data" 
            element={<TestLiveData />}
          />
          <Route 
            path="/subscription" 
            element={<SubscriptionPage />}
          />
          <Route 
            path="/live-sports" 
            element={<LiveSportsPage />}
          />
          <Route 
            path="/projections" 
            element={<SportsProjectionsPage />}
          />
          <Route 
            path="/analytics" 
            element={<Navigate to="/betting-hub" replace />}
          />
          <Route 
            path="/betting-data" 
            element={<Navigate to="/betting-hub" replace />}
          />
          <Route 
            path="/bet-tracking" 
            element={<Navigate to="/betting-hub" replace />}
          />
          <Route 
            path="/pick-em" 
            element={<PickEmPageDemo />}
          />
          <Route 
            path="/pick-em/pool/:poolId" 
            element={<PoolDetailPage />}
          />
          <Route 
            path="/fantasy-coming-soon" 
            element={<FantasyComingSoonPage />}
          />
          <Route 
            path="/live-scores" 
            element={<LiveScoresPage />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <AgentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/affiliate-disclosure"
            element={<AffiliateDisclosurePage />}
          />
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </MainContent>
      <Footer />
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