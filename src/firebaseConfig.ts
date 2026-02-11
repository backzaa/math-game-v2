// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 👈 1. เพิ่มบรรทัดนี้

// ค่า Config เดิมของคุณ (ถูกต้องแล้วครับ)
const firebaseConfig = {
  apiKey: "AIzaSyDbb4aE98ItkBAm690TVzxfSY7h5ykMZVE",
  authDomain: "math-game-by-kruback.firebaseapp.com",
  projectId: "math-game-by-kruback",
  storageBucket: "math-game-by-kruback.firebasestorage.app",
  messagingSenderId: "745286433206",
  appId: "1:745286433206:web:d355dc203989c8b255e917",
  measurementId: "G-H7MN0TMC73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// 👈 2. เพิ่มบรรทัดนี้ เพื่อส่งออกตัว database ไปใช้
export const db = getFirestore(app);