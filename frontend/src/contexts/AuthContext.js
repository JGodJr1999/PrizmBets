import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import analytics from '../utils/analytics';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  TOKEN_REFRESH: 'TOKEN_REFRESH'
};

// Initial state
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };
    
    default:
      return state;
  }
};

// Storage utilities
const TOKEN_STORAGE_KEY = 'prizmbets_auth_tokens';
const USER_STORAGE_KEY = 'prizmbets_user';

const storeTokens = (accessToken, refreshToken, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
    accessToken,
    refreshToken,
    timestamp: Date.now()
  }));
};

const getStoredTokens = () => {
  // Check localStorage first, then sessionStorage
  let tokens = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokens) {
    tokens = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }
  
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens);
      // Check if tokens are not too old (for security)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (Date.now() - parsed.timestamp > maxAge) {
        clearStoredTokens();
        return null;
      }
      return parsed;
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      clearStoredTokens();
      return null;
    }
  }
  return null;
};

const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
};

const storeUser = (user, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const getStoredUser = () => {
  let user = localStorage.getItem(USER_STORAGE_KEY);
  if (!user) {
    user = sessionStorage.getItem(USER_STORAGE_KEY);
  }
  
  if (user) {
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }
  return null;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const storedTokens = getStoredTokens();
      const storedUser = getStoredUser();
      
      if (storedTokens && storedTokens.accessToken && storedUser) {
        try {
          // Verify the token with the backend
          const userResponse = await apiService.getCurrentUser(storedTokens.accessToken);
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: userResponse.user,
              accessToken: storedTokens.accessToken,
              refreshToken: storedTokens.refreshToken
            }
          });
        } catch (error) {
          // Token might be expired, try to refresh
          if (storedTokens.refreshToken) {
            try {
              const refreshResponse = await apiService.refreshToken(storedTokens.refreshToken);
              
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user: refreshResponse.user,
                  accessToken: refreshResponse.access_token,
                  refreshToken: refreshResponse.refresh_token
                }
              });
              
              // Store the new tokens
              storeTokens(refreshResponse.access_token, refreshResponse.refresh_token, true);
              storeUser(refreshResponse.user, true);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              clearStoredTokens();
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          } else {
            clearStoredTokens();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Handle automatic logout on token expiration
  useEffect(() => {
    const handleTokenExpiration = () => {
      console.warn('Token expired, logging out user');
      clearStoredTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.error('Your session has expired. Please log in again.');
    };

    // Listen for token expiration events from the API service
    window.addEventListener('authTokenExpired', handleTokenExpiration);

    // Cleanup event listener
    return () => {
      window.removeEventListener('authTokenExpired', handleTokenExpiration);
    };
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await apiService.login(email, password, rememberMe);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token
        }
      });
      
      // Store tokens and user data
      storeTokens(response.access_token, response.refresh_token, rememberMe);
      storeUser(response.user, rememberMe);
      
      toast.success(`Welcome back, ${response.user.name}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await apiService.register(userData);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token
        }
      });
      
      // Store tokens and user data
      storeTokens(response.access_token, response.refresh_token, false);
      storeUser(response.user, false);
      
      toast.success(`Welcome to PrizmBets, ${response.user.name}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      if (state.accessToken) {
        await apiService.logout(state.accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearStoredTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData, state.accessToken);
      
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: response.user
      });
      
      // Update stored user data
      const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
      storeUser(response.user, rememberMe);
      
      toast.success('Profile updated successfully');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiService.changePassword(currentPassword, newPassword, state.accessToken);
      toast.success('Password changed successfully');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Token refresh function (called automatically)
  const refreshTokens = async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiService.refreshToken(state.refreshToken);
      
      dispatch({
        type: AUTH_ACTIONS.TOKEN_REFRESH,
        payload: {
          accessToken: response.access_token,
          refreshToken: response.refresh_token
        }
      });
      
      // Update stored tokens
      const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
      storeTokens(response.access_token, response.refresh_token, rememberMe);
      
      return response.access_token;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Firebase authentication for social login
  const loginWithFirebase = async (socialUserData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Create user in Flask backend with Firebase user data
      const backendUserData = {
        name: socialUserData.name || socialUserData.email.split('@')[0],
        email: socialUserData.email,
        firebase_uid: socialUserData.uid,
        provider: socialUserData.provider,
        terms_accepted: true,
        marketing_emails: false
      };

      // Register user in Flask backend
      const response = await apiService.registerFirebaseUser(backendUserData);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token
        }
      });
      
      // Store tokens and user data
      storeTokens(response.access_token, response.refresh_token, false);
      storeUser(response.user, false);
      
      toast.success(`Welcome to PrizmBets, ${response.user.name}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Social login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Firebase email/password registration
  const registerWithFirebase = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Get Firebase ID token for authentication
      const idToken = await userCredential.user.getIdToken();

      // Create user object from Firebase data
      const user = {
        uid: userCredential.user.uid,
        name: userData.name,
        email: userCredential.user.email,
        provider: 'email',
        terms_accepted: userData.terms_accepted,
        marketing_emails: userData.marketing_emails
      };

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: user,
          accessToken: idToken,
          refreshToken: null // Firebase handles token refresh internally
        }
      });

      // Store user data and Firebase token
      storeTokens(idToken, null, false);
      storeUser(user, false);

      toast.success(`Welcome to PrizmBets, ${user.name}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Firebase email/password login
  const loginWithFirebaseEmail = async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Set Firebase persistence based on "Remember Me" choice
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get Firebase ID token for backend authentication
      const idToken = await userCredential.user.getIdToken();

      // Prepare user data for backend verification
      const firebaseUserData = {
        firebase_uid: userCredential.user.uid,
        email: userCredential.user.email,
        id_token: idToken
      };

      // Create user object from Firebase data
      const user = {
        uid: userCredential.user.uid,
        name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        email: userCredential.user.email,
        provider: 'email'
      };

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: user,
          accessToken: idToken,
          refreshToken: null // Firebase handles token refresh internally
        }
      });

      // Store tokens and user data
      storeTokens(idToken, null, rememberMe);
      storeUser(user, rememberMe);

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    loginWithFirebase,
    loginWithFirebaseEmail,
    registerWithFirebase,
    logout,
    updateProfile,
    changePassword,
    refreshTokens,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;