import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Create user document in Firestore
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();

    try {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: displayName || additionalData.displayName || null,
        email,
        photoURL: photoURL || null,
        createdAt,
        updatedAt: createdAt,
        subscription: 'free',
        preferences: {
          favoriteTeams: [],
          favoriteSports: [],
          notifications: true
        },
        stats: {
          totalBets: 0,
          winRate: 0,
          totalWinnings: 0
        },
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  return userRef;
};

// Create user document by UID (for enhanced registration)
const createUserDocumentByUid = async (uid, userData) => {
  if (!uid) return;

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        uid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: 'free',
        preferences: {
          favoriteTeams: [],
          favoriteSports: [],
          notifications: true
        },
        stats: {
          totalBets: 0,
          winRate: 0,
          totalWinnings: 0
        },
        ...userData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  return userRef;
};

// Auth Service Functions
export const authService = {
  // Sign up with email and password
  signUpWithEmail: async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Create user document in Firestore
      await createUserDocument(user, { displayName });
      
      return { 
        success: true, 
        user,
        message: 'Account created successfully!' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Sign in with email and password
  signInWithEmail: async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      return { 
        success: true, 
        user,
        message: 'Signed in successfully!' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // Create/update user document
      await createUserDocument(user);
      
      // Update last login
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      return { 
        success: true, 
        user,
        message: 'Signed in with Google successfully!' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
      return { 
        success: true, 
        message: 'Signed out successfully!' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: 'Password reset email sent!' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Get current user data from Firestore
  getUserData: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { 
          success: true, 
          data: userSnap.data() 
        };
      } else {
        return { 
          success: false, 
          error: 'User data not found' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Update user profile
  updateUserProfile: async (uid, updates) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        message: 'Profile updated successfully!' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Create user document by UID (for enhanced registration)
  createUserDocument: createUserDocumentByUid
};

export default authService;