// src/services/storage.ts
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  increment, 
  query, 
  where,
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Student, MathQuestion, GameConfig, GameSession, RedemptionRecord, Gender, StudentBalance } from '../types';

const KEYS = {
  STUDENTS: 'math_game_students',
  QUESTIONS_DAILY: 'math_game_questions_daily',
  QUESTIONS_FREEPLAY: 'math_game_questions_freeplay',
  CONFIG: 'math_game_config',
  GAME_STATE: 'math_game_current_state',
  LOCAL_LOGS: 'math_game_local_logs',
  REDEMPTIONS: 'math_game_redemptions'
};

export const StorageService = {

  // ==========================================
  // 1. ระบบ Sync (หัวใจหลัก)
  // ==========================================
  async syncFromCloud(): Promise<boolean> {
    try {
      console.log('🔄 กำลังดึงข้อมูลจาก Firebase...');
      
      // 1.1 ดึง Session ทั้งหมดก่อน
      const sessionsSnap = await getDocs(collection(db, 'game_sessions'));
      const allSessions = sessionsSnap.docs.map(doc => doc.data() as GameSession);

      // 1.2 ดึงข้อมูลนักเรียน
      const studentsSnap = await getDocs(collection(db, 'students'));
      const students = studentsSnap.docs.map(doc => {
        const s = { id: doc.id, ...doc.data() } as Student;
        
        // กรองเอาเฉพาะ Session ของนักเรียนคนนี้
        s.sessions = allSessions.filter(sess => String(sess.sessionId) === String(s.id) || (sess as any).studentId === s.id);
        
        // คำนวณคะแนนรวมใหม่ (เพื่อให้หน้า Dashboard แสดงคะแนนถูกต้อง)
        if (s.sessions && s.sessions.length > 0) {
           s.sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
           s.totalScore = s.sessions.reduce((sum, sess) => sum + (sess.score || 0), 0);
        } else {
           s.totalScore = 0;
        }

        return s;
      }) as Student[];
      
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));

      // 1.3 ดึงข้อมูลโจทย์
      const questionsSnap = await getDocs(collection(db, 'questions'));
      const allQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      localStorage.setItem(KEYS.QUESTIONS_DAILY, JSON.stringify(allQuestions.filter(q => q.type === 'DAILY')));
      localStorage.setItem(KEYS.QUESTIONS_FREEPLAY, JSON.stringify(allQuestions.filter(q => q.type === 'FREEPLAY')));

      // 1.4 ดึงการตั้งค่า
      const configSnap = await getDoc(doc(db, 'settings', 'global_config'));
      if (configSnap.exists()) {
        localStorage.setItem(KEYS.CONFIG, JSON.stringify(configSnap.data()));
      }

      // 1.5 ดึงประวัติการแลกรางวัล
      const redemptionSnap = await getDocs(query(collection(db, 'redemptions'), orderBy('timestamp', 'desc')));
      const redemptions = redemptionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localStorage.setItem(KEYS.REDEMPTIONS, JSON.stringify(redemptions));

      console.log('✅ Sync ข้อมูลสำเร็จ (รวมคะแนนแล้ว)!');
      return true;
    } catch (error) {
      console.error('❌ Sync ล้มเหลว:', error);
      return false;
    }
  },

  // ==========================================
  // 2. Compatibility Layer (รองรับโค้ดเก่า)
  // ==========================================
  
  getAllStudents(): Student[] {
    return this.getStudents();
  },

  async registerStudent(id: string, fName: string, lName: string, nName: string, gender: Gender, classroom: string, img: string) {
    const newStudent: Student = { 
        id, 
        firstName: fName, 
        lastName: lName, 
        nickname: nName, 
        gender, 
        classroom, 
        profileImage: img, 
        totalScore: 0,
        sessions: [], 
        appearance: { base: gender === 'MALE' ? 'BOY' : 'GIRL', skinColor: '#fcd34d' } 
    };
    
    await setDoc(doc(db, 'students', id), newStudent);
    
    const students = this.getStudents();
    students.push(newStudent);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  async updateStudent(id: string, updates: Partial<Student>) {
    await updateDoc(doc(db, 'students', id), updates);
    await this.syncFromCloud();
  },

  async deleteStudent(id: string) {
    if(!confirm('ยืนยันลบนักเรียนคนนี้? ข้อมูลจะหายถาวร')) return;
    await deleteDoc(doc(db, 'students', id));
    
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  async deleteSession(studentId: string, sessionId: string) {
     const q = query(collection(db, 'game_sessions'), where('studentId', '==', studentId), where('sessionId', '==', sessionId));
     const snap = await getDocs(q);
     
     snap.forEach(async (d) => {
         await deleteDoc(d.ref);
         const scoreToRemove = d.data().score || 0;
         await updateDoc(doc(db, 'students', studentId), {
             totalScore: increment(-scoreToRemove)
         });
     });

     const students = this.getStudents();
     const idx = students.findIndex(s => s.id === studentId);
     if (idx !== -1 && students[idx].sessions) {
         students[idx].sessions = students[idx].sessions!.filter(s => s.sessionId !== sessionId);
         localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
     }
  },

  getAllRedemptions(): RedemptionRecord[] {
      const data = localStorage.getItem(KEYS.REDEMPTIONS);
      return data ? JSON.parse(data) : [];
  },

  getStudentBalance(studentId: string): StudentBalance {
      const students = this.getStudents();
      const student = students.find(s => String(s.id) === String(studentId));
      const redemptions = this.getAllRedemptions();

      const totalScore = student?.totalScore || 0;
      
      const myRedemptions = redemptions.filter(r => String(r.studentId) === String(studentId));
      const totalRedeemed = myRedemptions.reduce((sum, r) => sum + (r.pointsSpent || 0), 0);

      return {
          totalScore: totalScore,
          totalRedeemed: totalRedeemed,
          currentBalance: totalScore 
      };
  },
  
  // ==========================================
  // 3. Getters
  // ==========================================

  getStudents(): Student[] {
    const data = localStorage.getItem(KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  },

  getStudent(id: string): Student | undefined {
    const students = this.getStudents();
    return students.find(s => s.id === id);
  },

  getDailyQuestions(): MathQuestion[] {
    const data = localStorage.getItem(KEYS.QUESTIONS_DAILY);
    return data ? JSON.parse(data) : [];
  },

  getFreeplayQuestions(): MathQuestion[] {
    const data = localStorage.getItem(KEYS.QUESTIONS_FREEPLAY);
    return data ? JSON.parse(data) : [];
  },

  getGameConfig(): GameConfig | null {
    const data = localStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : null;
  },
  
  async saveGameConfig(config: GameConfig) {
      await setDoc(doc(db, 'settings', 'global_config'), config);
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },

  // ==========================================
  // 4. บันทึกผลการเล่น
  // ==========================================
  async addSession(studentId: string, session: GameSession, guestName?: string): Promise<void> {
    try {
      await addDoc(collection(db, 'game_sessions'), {
        studentId,
        guestName: guestName || null,
        ...session,
        timestamp: new Date().toISOString()
      });

      if (studentId !== '00') {
        const studentRef = doc(db, 'students', studentId);
        await updateDoc(studentRef, { totalScore: increment(session.score) });
        
        const localStudents = this.getStudents();
        const target = localStudents.find(s => s.id === studentId);
        if (target) {
            target.totalScore = (target.totalScore || 0) + session.score;
            if (!target.sessions) target.sessions = [];
            target.sessions.push(session);
            localStorage.setItem(KEYS.STUDENTS, JSON.stringify(localStudents));
        }
      }
    } catch (error) {
      console.error('❌ บันทึกคะแนนล้มเหลว:', error);
    }
  },

  // ==========================================
  // 5. แลกรางวัล
  // ==========================================
  async redeemReward(studentId: string, rewardName: string, pointsCost: number, teacherName: string): Promise<boolean> {
      try {
          const studentRef = doc(db, 'students', studentId);
          const studentSnap = await getDoc(studentRef);
          if (!studentSnap.exists()) return false;
          
          const currentScore = studentSnap.data().totalScore || 0;
          if (currentScore < pointsCost) {
              alert('คะแนนไม่พอครับ!');
              return false;
          }

          await updateDoc(studentRef, { totalScore: increment(-pointsCost) });

          const newRedemption = {
              studentId,
              rewardName,
              pointsSpent: pointsCost,
              teacherName,
              timestamp: new Date().toISOString()
          };

          await addDoc(collection(db, 'redemptions'), newRedemption);

          const localStudents = this.getStudents();
          const target = localStudents.find(s => s.id === studentId);
          if (target) {
              const oldScore = target.totalScore || 0;
              target.totalScore = oldScore - pointsCost;
              localStorage.setItem(KEYS.STUDENTS, JSON.stringify(localStudents));
          }
          
          const currentRedemptions = this.getAllRedemptions();
          currentRedemptions.unshift(newRedemption as any);
          localStorage.setItem(KEYS.REDEMPTIONS, JSON.stringify(currentRedemptions));

          return true;
      } catch (error) {
          console.error('แลกรางวัลล้มเหลว', error);
          return false;
      }
  },

  async getRedemptionHistory(): Promise<RedemptionRecord[]> {
      const q = query(collection(db, 'redemptions'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as RedemptionRecord));
  },

  // ==========================================
  // 6. Anti-Cheat & Utils
  // ==========================================
  saveGameState(state: any) {
    localStorage.setItem(KEYS.GAME_STATE, JSON.stringify(state));
  },

  loadGameState() {
    const data = localStorage.getItem(KEYS.GAME_STATE);
    return data ? JSON.parse(data) : null;
  },

  clearGameState() {
    localStorage.removeItem(KEYS.GAME_STATE);
  },

  checkLocalPlayedToday(studentId: string): boolean {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOCAL_LOGS) || '{}');
    const lastPlayed = logs[studentId];
    if (!lastPlayed) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastPlayed === today;
  },

  markLocalPlayedToday(studentId: string) {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOCAL_LOGS) || '{}');
    const today = new Date().toISOString().split('T')[0];
    logs[studentId] = today;
    localStorage.setItem(KEYS.LOCAL_LOGS, JSON.stringify(logs));
  }
};