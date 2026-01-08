// src/authService.js
import { auth } from "./firebase"; 
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";

// --- Email Sign-Up ---
export const registerEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// --- Email Login ---
export const loginEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// --- Logout ---
export const logoutUser = async () => {
  return signOut(auth);
};

// --- Password Reset ---
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

// --- Auth State Observer ---
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
