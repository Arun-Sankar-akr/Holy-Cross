// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";

// Replace with your actual Firebase project config values from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyB5ii2RFZCtmPNMNhww4O11DPiIp2Fo0OI",
    authDomain: "hcmss-2002.firebaseapp.com",
    projectId: "hcmss-2002",
    storageBucket: "hcmss-2002.firebasestorage.app",
    messagingSenderId: "505219583527",
    appId: "1:505219583527:web:0d1ad73eaca69b37994802"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);