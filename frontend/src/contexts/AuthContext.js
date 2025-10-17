import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
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

  // Initialize auth state with Firebase listener
  useEffect(() => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.uid || 'null');

      if (firebaseUser) {
        try {
          // Get fresh Firebase ID token
          const idToken = await firebaseUser.getIdToken();

          // Create user object from Firebase data
          const user = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email,
            provider: firebaseUser.providerData[0]?.providerId || 'email'
          };

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: user,
              accessToken: idToken,
              refreshToken: null // Firebase handles refresh internally
            }
          });

          // Store user data - check if we should remember
          const rememberMe = localStorage.getItem('prizmbets_remember_preference') === 'true';
          storeTokens(idToken, null, rememberMe);
          storeUser(user, rememberMe);
        } catch (error) {
          console.error('Error processing Firebase user:', error);
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        // User is signed out
        clearStoredTokens();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
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

  // Update user profile using Firebase
  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile with Firebase:', profileData);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Update Firebase Auth profile (displayName)
      if (profileData.name && profileData.name !== currentUser.displayName) {
        await updateFirebaseProfile(currentUser, {
          displayName: profileData.name
        });
        console.log('Firebase Auth profile updated');
      }

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        displayName: profileData.name || '',
        name: profileData.name || '',
        email: profileData.email || currentUser.email,
        lastUpdated: new Date().toISOString(),
        profileUpdatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, updateData, { merge: true });
      console.log('Firestore user document updated');

      // Update local state
      const updatedUser = {
        ...state.user,
        name: profileData.name,
        displayName: profileData.name,
        email: profileData.email || currentUser.email
      };

      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: updatedUser
      });

      // Update stored user data
      const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
      storeUser(updatedUser, rememberMe);

      console.log('Profile update completed successfully');
      toast.success('Profile updated successfully');
      return { success: true };

    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.message || 'Profile update failed';
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
  const registerWithFirebase = async (email, password, firstName, lastName, displayName = null) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Auto-generate display name if not provided
      let finalDisplayName = displayName;
      if (!finalDisplayName || finalDisplayName.trim() === '') {
        finalDisplayName = generateDisplayName(firstName, lastName, email);
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create full name from first and last name
      const fullName = `${firstName} ${lastName}`;

      // Update Firebase Auth profile
      await updateFirebaseProfile(userCredential.user, {
        displayName: finalDisplayName
      });

      // Create user document in Firestore
      const { authService } = await import('../services/firebase/authService');
      await authService.createUserDocument(userCredential.user.uid, {
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        displayName: finalDisplayName,
        email: email,
        photoURL: null,
        provider: 'email'
      });

      // Get Firebase ID token for authentication
      const idToken = await userCredential.user.getIdToken();

      // Create user object for state
      const user = {
        uid: userCredential.user.uid,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        displayName: finalDisplayName,
        name: finalDisplayName, // For backward compatibility
        email: email,
        photoURL: null,
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

      // Store user data and Firebase token
      storeTokens(idToken, null, false);
      storeUser(user, false);

      toast.success(`Welcome to PrizmBets, ${finalDisplayName}!`);
      return { success: true };

    } catch (error) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak'
        : error.message || 'Registration failed';

      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Helper function to generate display name
  const generateDisplayName = (firstName, lastName, email) => {
    // Option 1: Use first name + last initial
    return `${firstName}${lastName.charAt(0)}`;
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

      // Get complete user data from Firestore
      const { authService } = await import('../services/firebase/authService');
      const firestoreResult = await authService.getUserData(userCredential.user.uid);

      let user;
      if (firestoreResult.success) {
        // Use Firestore data with Firebase Auth fallbacks
        const firestoreData = firestoreResult.data;
        user = {
          uid: userCredential.user.uid,
          displayName: firestoreData.displayName || userCredential.user.displayName || userCredential.user.email.split('@')[0],
          fullName: firestoreData.fullName || null,
          name: firestoreData.displayName || userCredential.user.displayName || userCredential.user.email.split('@')[0], // For backward compatibility
          email: userCredential.user.email,
          photoURL: firestoreData.photoURL || userCredential.user.photoURL || null,
          provider: 'email',
          ...firestoreData // Include all other Firestore fields
        };
      } else {
        // Fallback to Firebase Auth data only
        user = {
          uid: userCredential.user.uid,
          displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
          name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL || null,
          provider: 'email'
        };
      }

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

  // Update user function for local state updates
  const updateUser = (updates) => {
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: {
        user: { ...state.user, ...updates },
        accessToken: state.accessToken,
        refreshToken: state.refreshToken
      }
    });

    // Update stored user data
    const rememberMe = localStorage.getItem('auth_token') !== null;
    storeUser({ ...state.user, ...updates }, rememberMe);
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
    clearError,
    updateUser
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