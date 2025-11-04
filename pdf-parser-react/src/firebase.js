// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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