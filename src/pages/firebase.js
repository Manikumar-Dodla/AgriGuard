// Firebase core
import { initializeApp } from "firebase/app";

// Firebase services
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";  // Optional, remove analytics in dev

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvr16WUaRgWS9nnrRm2KxVi32bDKH-J-k",
  authDomain: "agrigaurd-c6869.firebaseapp.com",
  projectId: "agrigaurd-c6869",
  storageBucket: "agrigaurd-c6869.appspot.com",
  messagingSenderId: "398628456678",
  appId: "1:398628456678:web:6421c065929f7a9b80d327",
  measurementId: "G-6J38DYTFM5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// remove analytics in local dev (it breaks in Vite sometimes)
// export const analytics = getAnalytics(app);
