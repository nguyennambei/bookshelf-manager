// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1TcqHw7_Zc4L88cgWFWNWaT0dLPhS95I",
  authDomain: "personal-app-1307.firebaseapp.com",
  projectId: "personal-app-1307",
  storageBucket: "personal-app-1307.firebasestorage.app",
  messagingSenderId: "669132733541",
  appId: "1:669132733541:web:19bf14810bf9ff7ea49a8c",
  measurementId: "G-7EPSLT1PZW",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
