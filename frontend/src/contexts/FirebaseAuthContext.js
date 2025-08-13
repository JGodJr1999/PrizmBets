import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import authService from '../services/firebase/authService';
import toast from 'react-hot-toast';

const FirebaseAuthContext = createContext({});

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch additional user data from Firestore
        const result = await authService.getUserData(firebaseUser.uid);
        if (result.success) {
          setUserData(result.data);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with email
  const signUp = async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.signUpWithEmail(email, password, displayName);
    
    if (result.success) {
      toast.success(result.message);
      setUser(result.user);
    } else {
      toast.error(result.error);
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Sign in with email
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.signInWithEmail(email, password);
    
    if (result.success) {
      toast.success(result.message);
      setUser(result.user);
    } else {
      toast.error(result.error);
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    const result = await authService.signInWithGoogle();
    
    if (result.success) {
      toast.success(result.message);
      setUser(result.user);
    } else {
      toast.error(result.error);
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    
    const result = await authService.signOut();
    
    if (result.success) {
      toast.success(result.message);
      setUser(null);
      setUserData(null);
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
    return result;
  };

  // Reset password
  const resetPassword = async (email) => {
    const result = await authService.resetPassword(email);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
    
    return result;
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    const result = await authService.updateUserProfile(user.uid, updates);
    
    if (result.success) {
      toast.success(result.message);
      // Refresh user data
      const dataResult = await authService.getUserData(user.uid);
      if (dataResult.success) {
        setUserData(dataResult.data);
      }
    } else {
      toast.error(result.error);
    }
    
    return result;
  };

  const value = {
    user,
    userData,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export default FirebaseAuthContext;