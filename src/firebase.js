import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgUYcyyHWky7RG_uxum4c2f4fuH-EC7b0",
  authDomain: "sordo-427b4.firebaseapp.com",
  projectId: "sordo-427b4",
  storageBucket: "sordo-427b4.firebasestorage.app",
  messagingSenderId: "1087737484404",
  appId: "1:1087737484404:web:e3c680ac20df4aa17d6d21"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };