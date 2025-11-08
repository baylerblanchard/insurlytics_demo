// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXAoeB_4Ucdmj-Kti3Cp22zN8DlJab04c",
  authDomain: "insurlytics-demo.firebaseapp.com",
  projectId: "insurlytics-demo",
  storageBucket: "insurlytics-demo.firebasestorage.app",
  messagingSenderId: "334255668039",
  appId: "1:334255668039:web:cd3889a2ac3934dc766a62",
  measurementId: "G-NDR65LGKZE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
