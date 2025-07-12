import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// IMPORTANT: Add your Firebase project configuration here before deployment.
// These values can be found in your Firebase project settings.
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
const app = firebase.initializeApp(firebaseConfig);

// Export services to be used throughout the app
export const auth = getAuth(app);
export const db = getFirestore(app);
