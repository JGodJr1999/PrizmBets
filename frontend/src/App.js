import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import ParlayPage from './pages/ParlayPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import LiveSportsPage from './pages/LiveSportsPage';
import PickEmPageDemo from './pages/PickEmPageDemo';
import PoolDetailPage from './pages/PoolDetailPage';
import FantasyComingSoonPage from './pages/FantasyComingSoonPage';
import SportsProjectionsPage from './pages/SportsProjectionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BettingDataPage from './pages/BettingDataPage';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

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
          path="/parlay" 
          element={<ParlayPage />}
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
          element={<AnalyticsPage />}
        />
        <Route 
          path="/betting-data" 
          element={<BettingDataPage />}
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
        {/* Catch-all route for 404 errors */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
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
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;