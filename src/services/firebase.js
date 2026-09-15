import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1oe7YzWinsBZejhGkVM0h1IGYh9i0I0w",
  authDomain: "crypto-choiz.firebaseapp.com",
  projectId: "crypto-choiz",
  storageBucket: "crypto-choiz.firebasestorage.app",
  messagingSenderId: "441693466693",
  appId: "1:441693466693:web:e59f1ca0eccf405eb1332c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);