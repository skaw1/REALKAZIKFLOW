// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken, // Import for custom token sign-in
  onAuthStateChanged // Import for listening to auth state changes
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import for Firestore

// Global variables provided by the Canvas environment
// These are MANDATORY and MUST be used for Firebase initialization and authentication.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // Fallback config for local development if __firebase_config is not defined
  apiKey: "AIzaSyDug6i2EJEWR1MfYcunSmxV1SQgySZLzN0",
  authDomain: "displaywebsites.firebaseapp.com",
  databaseURL: "https://displaywebsites-default-rtdb.firebaseio.com",
  projectId: "displaywebsites",
  storageBucket: "displaywebsites.firebasestorage.app",
  messagingSenderId: "336087816407",
  appId: "1:336087816407:web:c3972bb85ce1e0d4c53892",
  measurementId: "G-EK1KG6ZRCJ"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase service instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Variable to store the current user ID
export let userId = null;

// Function to handle Firebase authentication and set up user ID
export const setupAuth = async () => {
  try {
    if (initialAuthToken) {
      // Sign in with custom token if provided (for authenticated Canvas users)
      await signInWithCustomToken(auth, initialAuthToken);
      console.log("Signed in with custom token.");
    } else {
      // If no custom token is provided, no user will be signed in.
      // This means Firestore operations requiring authentication will fail.
      console.warn("No initial authentication token provided. User will not be signed in.");
    }
  } catch (error) {
    console.error("Firebase authentication failed with custom token:", error);
    console.warn("User will not be signed in due to authentication error.");
  }

  // Set up an auth state change listener to update the userId
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      userId = user.uid;
      console.log("Auth state changed. Current user ID:", userId);
    } else {
      // User is signed out or not authenticated
      userId = null; // Set userId to null if no user is signed in
      console.log("Auth state changed. No user signed in.");
    }
  });
};

// You might also want to export the app instance itself if needed elsewhere
export { app };
