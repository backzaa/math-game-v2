import type { StudentProfile, GameSession, MathQuestion, Gender, GameGlobalConfig } from '../types';

const STORAGE_KEY = 'math_adventure_students';
const DAILY_QUESTIONS_KEY = 'math_adventure_daily_questions';
const FREEPLAY_QUESTIONS_KEY = 'math_adventure_freeplay_questions'; 
const GAME_CONFIG_KEY = 'math_adventure_config';
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2ABHg3iQAzR1Tlj-2b1yLfXae_RXDErZjGLXrFLNR0cF5RzIq3PDEklhVPhsL62DK/exec";

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

  // [UPDATED] ฟังก์ชันบันทึกคะแนน
  saveScore: async (
    id: string, 
    name: string, 
    score: number, 
    realScore: number, 
    bonusScore: number, 
    mode: string, 
    details: any[],
    gameType: string = 'CLASSIC',
    totalDistance: number = 0
  ) => {
      const students = StorageService.getAllStudents();
      const idx = students.findIndex(s => String(Number(s.id)) === String(Number(id)));
      
      if (idx !== -1) {
          const newSession: GameSession = {
              sessionId: Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              timestamp: new Date().toISOString(),
              score,
              realScore,
              bonusScore,
              mode: mode as any,
              details,
              // @ts-ignore
              gameType,
              totalDistance
          };

          if (!students[idx].sessions) students[idx].sessions = [];
          students[idx].sessions.push(newSession);
          
          // [แก้ Error 1] ใช้ (as any) เพื่อเข้าถึง property score
          const currentTotal = (students[idx] as any).score || 0;
          (students[idx] as any).score = currentTotal + realScore; 

          localStorage.setItem(STORAGE_KEY, JSON.stringify(students));

          try { 
              await fetch(SCRIPT_URL, { 
                  method: 'POST', mode: 'no-cors', 
                  body: JSON.stringify({ 
                      action: 'saveScore', 
                      id, 
                      name: name || students[idx].firstName, // [แก้ Error 2] ใช้ตัวแปร name ที่รับมาด้วย
                      score, 
                      realScore, 
                      bonusScore, 
                      mode, 
                      details,
                      gameType,
                      totalDistance
                  }) 
              }); 
          } catch (e) {}
      }
  },

  // Alias
  addSession: async (id: string, sess: GameSession) => {
      // คำนวณ realScore จาก details
      const realScore = sess.details ? sess.details.reduce((sum, d) => sum + (d.isCorrect ? d.scoreEarned : 0), 0) : 0;
      // ถ้าเป็นโหมด RALLY (มี totalDistance) ให้ถือว่า bonus เป็น 0
      // @ts-ignore
      const isRally = sess.gameType === 'RALLY';
      const bonusScore = isRally ? 0 : (sess.score - realScore);

      // @ts-ignore
      const gType = sess.gameType || 'CLASSIC';
      // @ts-ignore
      const tDist = sess.totalDistance || 0;

      await StorageService.saveScore(
          id, 
          '', 
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
        if (data.students) {
              // @ts-ignore
              const students = data.students.map((s: any) => {
                  // @ts-ignore
                  const studentScores = data.scores ? data.scores.filter((sc: any) => String(sc.studentId) === String(s.id)) : [];
                  
                  // คำนวณคะแนนรวมใหม่ (รวม Real Score ทั้งหมด)
                  const totalRealScore = studentScores.reduce((sum: number, sc: any) => sum + (Number(sc.realScore) || 0), 0);

                  return {
                      ...s,
                      score: totalRealScore, // อัปเดตคะแนนรวมที่นี่
                      profileImage: formatImageLink(s.profileImage || ''),
                      // @ts-ignore
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
              localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
          }
          if (data.settings) localStorage.setItem(GAME_CONFIG_KEY, JSON.stringify(data.settings));
          if (data.dailyQs) localStorage.setItem(DAILY_QUESTIONS_KEY, JSON.stringify(data.dailyQs));
          if (data.freeplayQs) localStorage.setItem(FREEPLAY_QUESTIONS_KEY, JSON.stringify(data.freeplayQs));
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
  
  getFreeplayQuestions: () => { const d = localStorage.getItem(FREEPLAY_QUESTIONS_KEY); return d ? JSON.parse(d) : []; }
};