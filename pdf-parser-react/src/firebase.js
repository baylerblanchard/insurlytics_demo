import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Consolidated import: both getAuth and GoogleAuthProvider in one line
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyBXAoeB_4Ucdmj-Kti3Cp22zN8DlJab04c",

  authDomain: "insurlytics-demo.firebaseapp.com",

  projectId: "insurlytics-demo",

  storageBucket: "insurlytics-demo.firebasestorage.app",

  messagingSenderId: "334255668039",

  appId: "1:334255668039:web:cd3889a2ac3934dc766a62",

  measurementId: "G-NDR65LGKZE"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export auth and googleProvider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();