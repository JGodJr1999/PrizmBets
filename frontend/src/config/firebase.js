import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
// You can get these from: https://console.firebase.google.com/
// 1. Create a new project or select existing
// 2. Go to Project Settings > General
// 3. Scroll down to "Your apps" and click "Add app" > Web
// 4. Copy the configuration below

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Export the app instance
export default app;