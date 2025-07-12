// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // <-- Add this import for authentication
import { getFirestore } from 'firebase/firestore'; // <-- Add this import for Firestore

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDug6i2EJEWR1MfYcunSmxV1SQgySZLzN0",
  authDomain: "displaywebsites.firebaseapp.com",
  databaseURL: "https://displaywebsites-default-rtdb.firebaseio.com",
  projectId: "displaywebsites",
  storageBucket: "displaywebsites.firebasestorage.app",
  messagingSenderId: "336087816407",
  appId: "1:336087816407:web:c3972bb85ce1e0d4c53892",
  measurementId: "G-EK1KG6ZRCJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services to be used throughout the app
export const auth = getAuth(app); // Now getAuth is defined
export const db = getFirestore(app); // Now getFirestore is defined

// You might also want to export the app instance itself if needed elsewhere
export { app };
