// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDtphtg1BuhTTkKc7ZWBvEjXPLLaQ8DwLs",
  authDomain: "pipsprofit-32cbe.firebaseapp.com",
  projectId: "pipsprofit-32cbe",
  storageBucket: "pipsprofit-32cbe.firebasestorage.app",
  messagingSenderId: "562385844428",
  appId: "1:562385844428:web:84f28c0291ed32b394aa69",
  measurementId: "G-8FV6VKTZT2"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { app, analytics, auth, db };
