// src/components/MigrationTool.tsx
import { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, writeBatch } from 'firebase/firestore';

// ข้อมูลคะแนนจาก Scores.csv ของคุณ
const scoresData = [
  {
    "timestamp": "2026-02-10 16:53:18",
    "studentId": "1",
    "studentName": "วีรภัทร์",
    "score": 100,
    "realScore": 80,
    "bonusScore": 20,
    "mode": "CLASSROOM",
    "gameType": "CLASSIC",
    "totalDistance": 0,
    "duration": 250,
    "details": [{"questionText":"56 + 45","isCorrect":true,"scoreEarned":10},{"questionText":"94 - 35","isCorrect":true,"scoreEarned":10},{"questionText":"47 - 12","isCorrect":true,"scoreEarned":10},{"questionText":"39 + 17","isCorrect":true,"scoreEarned":10},{"questionText":"71 - 55","isCorrect":true,"scoreEarned":10},{"questionText":"56 + 45","isCorrect":true,"scoreEarned":10},{"questionText":"94 - 35","isCorrect":true,"scoreEarned":10},{"questionText":"47 - 12","isCorrect":false,"scoreEarned":0},{"questionText":"39 + 17","isCorrect":false,"scoreEarned":0},{"questionText":"71 - 55","isCorrect":true,"scoreEarned":10}]
  },
  {
    "timestamp": "2026-02-10 18:22:15",
    "studentId": "2",
    "studentName": "วชรพล",
    "score": 320,
    "realScore": 320,
    "bonusScore": 0,
    "mode": "RALLY",
    "gameType": "RALLY",
    "totalDistance": 320,
    "duration": 0,
    "details": [{"questionText":"70 - 17","isCorrect":true,"scoreEarned":10},{"questionText":"51 - 31","isCorrect":true,"scoreEarned":10},{"questionText":"44 - 17","isCorrect":true,"scoreEarned":10},{"questionText":"40 - 19","isCorrect":true,"scoreEarned":10},{"questionText":"98 - 40","isCorrect":false,"scoreEarned":0},{"questionText":"52 - 18","isCorrect":true,"scoreEarned":10},{"questionText":"56 - 36","isCorrect":true,"scoreEarned":10}]
  },
  {
    "timestamp": "2026-02-11 12:37:18",
    "studentId": "0", // Guest
    "studentName": "ผู้มาเยือน",
    "score": 40,
    "realScore": 20,
    "bonusScore": 0,
    "mode": "CLASSROOM",
    "gameType": "RALLY", // ข้อมูลดิบระบุแบบนี้
    "totalDistance": 120,
    "duration": 0,
    "details": [{"questionText":"27 + 47","isCorrect":true,"scoreEarned":10},{"questionText":"51 - 31","isCorrect":false,"scoreEarned":0},{"questionText":"98 - 40","isCorrect":true,"scoreEarned":10},{"questionText":"70 - 17","isCorrect":false,"scoreEarned":0}]
  }
];

export const MigrationTool = () => {
  const [status, setStatus] = useState("รอคำสั่ง...");

  const migrateScores = async () => {
    setStatus("⏳ กำลังย้ายประวัติคะแนน...");
    try {
      const batch = writeBatch(db);
      
      scoresData.forEach((item) => {
        // ใช้ timestamp เป็น ID ไปเลยจะได้ไม่ซ้ำ
        const docId = `history_${item.timestamp.replace(/[: ]/g, '')}_${item.studentId}`;
        const ref = doc(db, "game_sessions", docId);
        
        // แปลงข้อมูลให้ตรงกับ Format ใหม่
        const sessionData = {
            sessionId: item.timestamp, // ใช้ timestamp เดิมเป็น ID
            studentId: item.studentId,
            guestName: item.studentId === '0' ? item.studentName : null,
            score: item.score,
            realScore: item.realScore,
            bonusScore: item.bonusScore,
            mode: item.mode,
            gameType: item.gameType || 'CLASSIC',
            totalDistance: item.totalDistance || 0,
            duration: item.duration || 0,
            details: item.details,
            timestamp: new Date(item.timestamp).toISOString(), // แปลงเป็น ISO String มาตรฐาน
            date: new Date(item.timestamp).toLocaleDateString('th-TH')
        };

        batch.set(ref, sessionData);
      });

      await batch.commit();
      setStatus("✅ ย้ายคะแนนสำเร็จ! (ไปเช็คใน Dashboard ได้เลย)");
    } catch (e) {
      console.error(e);
      setStatus("❌ เกิดข้อผิดพลาด: " + e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center z-[9999]">
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-6 text-yellow-400">🔥 ย้ายข้อมูลคะแนนเก่า</h1>
        <p className="mb-6 text-slate-300">กดปุ่มนี้เพื่อนำคะแนนจาก Excel ขึ้น Firebase</p>
        
        <button onClick={migrateScores} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-lg font-bold transition text-xl">
          🚀 ย้ายประวัติคะแนน ({scoresData.length} รายการ)
        </button>

        <div className="mt-8 p-4 bg-black/50 rounded-lg text-center font-mono text-sm text-green-300 border border-slate-700">
          STATUS: {status}
        </div>
      </div>
    </div>
  );
};