import type { StudentProfile, GameSession, MathQuestion, Gender, GameGlobalConfig, RedemptionRecord, StudentBalance } from '../types';

const STORAGE_KEY = 'math_adventure_students';
const DAILY_QUESTIONS_KEY = 'math_adventure_daily_questions';
const FREEPLAY_QUESTIONS_KEY = 'math_adventure_freeplay_questions'; 
const GAME_CONFIG_KEY = 'math_adventure_config';
const REDEMPTIONS_KEY = 'math_adventure_redemptions'; // Key สำหรับเก็บประวัติแลกของ
// URL ของ Google Apps Script ที่ Deploy ล่าสุด
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwsOBj0oj-1RSL5EjmLq5lKa7YHKGwxuP6MYPV93hJg2rPnvj01VXEpmEC0S7HS440/exec";

const formatImageLink = (url: string) => {
    if (!url) return '';
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        const idMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) return `https://docs.google.com/uc?export=view&id=${idMatch[1]}`;
    }
    if (link.includes('dropbox.com')) return link.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    return link;
};

export const StorageService = {
  getAllStudents: (): StudentProfile[] => { 
      try { 
          const data = localStorage.getItem(STORAGE_KEY); 
          const students = data ? JSON.parse(data) : [];
          return students.map((s: StudentProfile) => ({
              ...s,
              profileImage: formatImageLink(s.profileImage || '')
          }));
      } catch (e) { return []; }
  },

  getStudent: (id: string): StudentProfile | null => {
      const students = StorageService.getAllStudents();
      return students.find(s => String(Number(s.id)) === String(Number(id))) || null;
  },

  registerStudent: async (id: string, fName: string, lName: string, nName: string, gender: Gender, classroom: string, img: string) => {
      const students = StorageService.getAllStudents();
      const newStudent: StudentProfile = { id, firstName: fName, lastName: lName, nickname: nName, gender, classroom, profileImage: formatImageLink(img), sessions: [], appearance: { base: gender === 'MALE' ? 'BOY' : 'GIRL', skinColor: '#fcd34d' } };
      students.push(newStudent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveStudent', ...newStudent }) }); } catch (e) {}
  },

  updateStudent: async (id: string, updates: Partial<StudentProfile>) => {
      const students = StorageService.getAllStudents();
      const idx = students.findIndex(s => String(Number(s.id)) === String(Number(id)));
      if (idx !== -1) {
          const formattedUpdates = { ...updates, profileImage: updates.profileImage ? formatImageLink(updates.profileImage) : students[idx].profileImage };
          students[idx] = { ...students[idx], ...formattedUpdates };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
          try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveStudent', ...students[idx] }) }); } catch (e) {}
      }
  },

  deleteStudent: async (id: string) => {
      const students = StorageService.getAllStudents().filter(s => String(Number(s.id)) !== String(Number(id)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      try { 
          await fetch(SCRIPT_URL, { 
              method: 'POST', 
              mode: 'no-cors', 
              body: JSON.stringify({ action: 'deleteStudent', id: id }) 
          });
      } catch (e) { console.error("Error deleting from cloud:", e); }
  },

  saveGameConfig: async (config: GameGlobalConfig) => {
      localStorage.setItem(GAME_CONFIG_KEY, JSON.stringify(config));
      try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveSettings', payload: config }) }); } catch (e) {}
  },

  getGameConfig: () => { const data = localStorage.getItem(GAME_CONFIG_KEY); return data ? JSON.parse(data) : null; },

  deleteSession: async (sid: string, sessId: string) => {
      const all = StorageService.getAllStudents();
      const idx = all.findIndex(s => String(Number(s.id)) === String(Number(sid)));
      
      if (idx !== -1) { 
          all[idx].sessions = all[idx].sessions.filter(s => s.sessionId !== sessId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); 
          try { 
              await fetch(SCRIPT_URL, { 
                  method: 'POST', 
                  mode: 'no-cors', 
                  body: JSON.stringify({ action: 'deleteScore', studentId: sid, sessionId: sessId }) 
              });
          } catch (e) { console.error("Error deleting score:", e); }
      }
  },

  // --- ระบบล็อคโหมดห้องเรียน (Locking) ---
  markPlayedToday: (studentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`locked_classroom_${studentId}_${today}`, 'true');
  },

  checkLocalPlayedToday: (studentId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`locked_classroom_${studentId}_${today}`) === 'true';
  },

  // --- ระบบแลกของรางวัล (Redemption System) ---
  
  // 1. ดึงประวัติการแลกทั้งหมดจาก Local
  getAllRedemptions: (): RedemptionRecord[] => {
      try {
          const data = localStorage.getItem(REDEMPTIONS_KEY);
          return data ? JSON.parse(data) : [];
      } catch (e) { return []; }
  },

  // 2. คำนวณยอดเงินคงเหลือ (รายรับ - รายจ่าย)
  getStudentBalance: (studentId: string): StudentBalance => {
      const students = StorageService.getAllStudents();
      const student = students.find(s => String(s.id) === String(studentId)); // ใช้ String comparison เพื่อความชัวร์
      const redemptions = StorageService.getAllRedemptions();

      // คำนวณรายรับ (Total Score)
      let totalScore = 0;
      if (student && student.sessions) {
          totalScore = student.sessions.reduce((sum, sess) => sum + (sess.score || 0), 0);
      }

      // คำนวณรายจ่าย (Total Redeemed) ของเด็กคนนี้
      const myRedemptions = redemptions.filter(r => String(r.studentId) === String(studentId));
      const totalRedeemed = myRedemptions.reduce((sum, r) => sum + (r.pointsSpent || 0), 0);

      return {
          totalScore: totalScore,
          totalRedeemed: totalRedeemed,
          currentBalance: totalScore - totalRedeemed
      };
  },

  // 3. สั่งแลกของรางวัล
  redeemReward: async (studentId: string, rewardName: string, points: number, teacherName: string) => {
      // บันทึกลง Local Storage ทันที
      const newRecord: RedemptionRecord = {
          timestamp: new Date().toISOString(),
          studentId: studentId,
          rewardName: rewardName,
          pointsSpent: points,
          teacherName: teacherName
      };

      const allRedemptions = StorageService.getAllRedemptions();
      allRedemptions.push(newRecord);
      localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(allRedemptions));

      // ส่งไปบันทึก Cloud (Google Sheet: reward_history)
      try {
          await fetch(SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              body: JSON.stringify({
                  action: 'redeemReward',
                  studentId: studentId,
                  rewardName: rewardName,
                  pointsSpent: points,
                  teacherName: teacherName
              })
          });
          return true;
      } catch (e) {
          console.error("Redeem Error", e);
          return false;
      }
  },

  // --- End Reward System ---

  saveScore: async (
    id: string, 
    name: string, 
    score: number, 
    realScore: number, 
    bonusScore: number, 
    mode: string, 
    details: any[],
    gameType: string = 'CLASSIC',
    totalDistance: number = 0,
    duration: number = 0 // [แก้ไข 1] รับค่าเวลาเพิ่มตรงนี้
  ) => {
      // [Lock Logic] ถ้าเป็นโหมดห้องเรียน ให้ฝัง Lock ลงเครื่องทันที
      if (mode === 'CLASSROOM' && id !== '00') {
          StorageService.markPlayedToday(id);
      }

      // --- กรณี Guest (ID 00) ---
      if (id === '00') {
          try { 
              await fetch(SCRIPT_URL, { 
                  method: 'POST', mode: 'no-cors', 
                  body: JSON.stringify({ 
                      action: 'saveScore', 
                      id: '00', 
                      name: name || 'ผู้มาเยือน', 
                      score, 
                      realScore, 
                      bonusScore, 
                      mode, 
                      details,
                      gameType,
                      totalDistance,
                      duration // [แก้ไข 2] ส่งเวลาของ Guest ไปด้วย
                  }) 
              }); 
          } catch (e) {}
          return; 
      }

      // --- กรณีนักเรียนปกติ ---
      const students = StorageService.getAllStudents();
      const idx = students.findIndex(s => String(Number(s.id)) === String(Number(id)));
      
      if (idx !== -1) {
          const newSession: GameSession = {
              sessionId: Date.now().toString(),
              date: new Date().toLocaleDateString('th-TH'), // ใช้ toLocaleDateString ให้ตรงกับ Format ไทย
              timestamp: new Date().toISOString(), // [แก้ไข] ใช้ ISO String เหมือนเดิม เพื่อแก้ Error types
              score,
              realScore,
              bonusScore,
              mode: mode as any,
              details,
              // @ts-ignore
              gameType,
              totalDistance,
              duration // [แก้ไข 3] บันทึกเวลาลงในประวัติเครื่อง (เพื่อให้หน้าครูเห็น)
          };

          if (!students[idx].sessions) students[idx].sessions = [];
          students[idx].sessions.push(newSession);
          
          // อัปเดตคะแนนรวม (ถ้ามี logic นี้อยู่แล้ว)
          const currentTotal = (students[idx] as any).score || 0;
          (students[idx] as any).score = currentTotal + realScore; 

          localStorage.setItem(STORAGE_KEY, JSON.stringify(students));

          try { 
              await fetch(SCRIPT_URL, { 
                  method: 'POST', mode: 'no-cors', 
                  body: JSON.stringify({ 
                      action: 'saveScore', 
                      id, 
                      name: name || students[idx].firstName, 
                      score, 
                      realScore, 
                      bonusScore, 
                      mode, 
                      details,
                      gameType,
                      totalDistance,
                      duration // [แก้ไข 4] ส่งเวลาไปให้ Google Sheet
                  }) 
              }); 
          } catch (e) {}
      }
  },

  addSession: async (id: string, sess: GameSession, studentName: string = '') => {
      const realScore = sess.details ? sess.details.reduce((sum, d) => sum + (d.isCorrect ? d.scoreEarned : 0), 0) : 0;
      // @ts-ignore
      const isRally = sess.gameType === 'RALLY';
      const bonusScore = isRally ? 0 : (sess.score - realScore);

      // @ts-ignore
      const gType = sess.gameType || 'CLASSIC';
      // @ts-ignore
      const tDist = sess.totalDistance || 0;

      await StorageService.saveScore(
          id, 
          studentName, 
          sess.score, 
          realScore, 
          bonusScore, 
          sess.mode, 
          sess.details || [],
          gType,
          tDist
      );
  },

  syncFromCloud: async () => {
    try {
      const resp = await fetch(SCRIPT_URL + '?t=' + new Date().getTime());
      const data = await resp.json();
      
      let students: StudentProfile[] = [];
      if (data.students) {
            students = data.students.map((s: any) => {
                const studentScores = data.scores ? data.scores.filter((sc: any) => String(sc.studentId) === String(s.id)) : [];
                const totalRealScore = studentScores.reduce((sum: number, sc: any) => sum + (Number(sc.realScore) || 0), 0);

                return {
                    ...s,
                    score: totalRealScore, 
                    profileImage: formatImageLink(s.profileImage || ''),
                    sessions: studentScores.map((sc: any) => ({
                        sessionId: sc.timestamp,
                        date: new Date(sc.timestamp).toLocaleDateString('th-TH'),
                        timestamp: sc.timestamp,
                        realScore: Number(sc.realScore) || 0,
                        bonusScore: Number(sc.bonusScore) || 0,
                        score: Number(sc.totalScore) || 0,
                        mode: sc.mode,
                        details: typeof sc.details === 'string' ? JSON.parse(sc.details) : sc.details,
                        gameType: sc.gameType || 'CLASSIC',
                        totalDistance: Number(sc.totalDistance) || 0
                    }))
                };
            });
      }

      const guestScores = data.scores ? data.scores.filter((sc: any) => String(sc.studentId) === '0' || String(sc.studentId) === '00') : [];
      
      if (guestScores.length > 0) {
          const totalGuestScore = guestScores.reduce((sum: number, sc: any) => sum + (Number(sc.realScore) || 0), 0);
          
          const guestStudent: any = {
              id: '00',
              firstName: 'ผู้มาเยือน',
              lastName: '',
              nickname: 'Guest',
              gender: 'MALE',
              classroom: 'ทั่วไป',
              profileImage: '', 
              score: totalGuestScore,
              appearance: { base: 'BOY', skinColor: '#fcd34d' },
              sessions: guestScores.map((sc: any) => ({
                  sessionId: sc.timestamp,
                  date: new Date(sc.timestamp).toLocaleDateString('th-TH'),
                  timestamp: sc.timestamp,
                  playedBy: sc.studentName || sc.name || sc.Student_Name,
                  realScore: Number(sc.realScore) || 0,
                  bonusScore: Number(sc.bonusScore) || 0,
                  score: Number(sc.totalScore) || 0,
                  mode: sc.mode,
                  details: typeof sc.details === 'string' ? JSON.parse(sc.details) : sc.details,
                  gameType: sc.gameType || 'CLASSIC',
                  totalDistance: Number(sc.totalDistance) || 0
              }))
          };
          
          const existingGuestIdx = students.findIndex(s => s.id === '00');
          if (existingGuestIdx !== -1) {
              students[existingGuestIdx] = guestStudent;
          } else {
              students.push(guestStudent);
          }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        
      if (data.settings) localStorage.setItem(GAME_CONFIG_KEY, JSON.stringify(data.settings));
      if (data.dailyQs) localStorage.setItem(DAILY_QUESTIONS_KEY, JSON.stringify(data.dailyQs));
      if (data.freeplayQs) localStorage.setItem(FREEPLAY_QUESTIONS_KEY, JSON.stringify(data.freeplayQs));
      
      // [Sync Reward History] ดึงข้อมูลแลกของจาก Cloud
      if (data.redemptions) {
          localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(data.redemptions));
      }

      return true;

    } catch (e) { return false; }
  },

  saveDailyQuestions: async (qs: MathQuestion[]) => {
      localStorage.setItem(DAILY_QUESTIONS_KEY, JSON.stringify(qs));
      try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveQuestions', mode: 'CLASSROOM', payload: qs }) }); } catch (e) {}
  },

  getDailyQuestions: () => { const d = localStorage.getItem(DAILY_QUESTIONS_KEY); return d ? JSON.parse(d) : []; },

  saveFreeplayQuestions: async (qs: MathQuestion[]) => {
      localStorage.setItem(FREEPLAY_QUESTIONS_KEY, JSON.stringify(qs));
      try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'saveQuestions', mode: 'FREEPLAY', payload: qs }) }); } catch (e) {}
  },

  getFreeplayPool: () => { const d = localStorage.getItem(FREEPLAY_QUESTIONS_KEY); return d ? JSON.parse(d) : []; },
  
  getFreeplayQuestions: () => { const d = localStorage.getItem(FREEPLAY_QUESTIONS_KEY); return d ? JSON.parse(d) : []; },

  // --- Auto-Save System ---
  saveGameState: (data: any) => {
    const payload = {
        date: new Date().toISOString().split('T')[0], 
        data: data
    };
    localStorage.setItem('math_game_autosave', JSON.stringify(payload));
  },

  loadGameState: () => {
    try {
        const raw = localStorage.getItem('math_game_autosave');
        if (!raw) return null;
        
        const parsed = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];

        if (parsed.date !== today) {
            localStorage.removeItem('math_game_autosave');
            return null;
        }
        return parsed.data;
    } catch (e) { return null; }
  },

  clearGameState: () => {
      localStorage.removeItem('math_game_autosave');
  } 
};