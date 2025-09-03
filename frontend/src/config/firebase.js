import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-HDzYpHcsnWDFU2_OcgJL4Pbrfq2BwNQ",
  authDomain: "smartbets-5c06f.firebaseapp.com",
  projectId: "smartbets-5c06f",
  storageBucket: "smartbets-5c06f.firebasestorage.app",
  messagingSenderId: "729118879083",
  appId: "1:729118879083:web:15d07f682b86098dc1f02e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = getAnalytics(app);

// Configure authentication providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Apple Sign-In provider
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Export the app instance
export default app;