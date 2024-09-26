import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js"; // Import authentication service

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOC-a_k4IEpdeW_Rms6v_V8jBgdTO2k5M",
  authDomain: "tradeare-us-2nx4zp.firebaseapp.com",
  projectId: "tradeare-us-2nx4zp",
  storageBucket: "tradeare-us-2nx4zp.appspot.com",
  messagingSenderId: "752862844692",
  appId: "1:752862844692:web:5d656e58696c44d5ef9401"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth };
