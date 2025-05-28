// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbPRUjOMt6iL4QLJmz_p09k7gGu1p4_v4",
  authDomain: "mednova-10.firebaseapp.com",
  projectId: "mednova-10",
  storageBucket: "mednova-10.firebasestorage.app",
  messagingSenderId: "725141105880",
  appId: "1:725141105880:web:ad1f8092f8c250fa05fbad",
  measurementId: "G-8X0MDYY7N5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(); 

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };