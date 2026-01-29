// [แก้ไข] เติม type และลบ PlayerState ที่ไม่ได้ใช้ออก
import type { StudentProfile, MathQuestion, GameConfig, QuestionSet } from '../types';

const KEYS = {
  STUDENTS: 'math_game_students',
  QUESTIONS_DAILY: 'math_game_questions_daily',
  QUESTIONS_FREEPLAY: 'math_game_questions_free',
  CONFIG: 'math_game_config'
};

export const StorageService = {
  // --- นักเรียน ---
  getStudents: (): StudentProfile[] => {
    const data = localStorage.getItem(KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  },

  saveStudent: (student: StudentProfile) => {
    const students = StorageService.getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  deleteStudent: (id: string) => {
    const students = StorageService.getStudents().filter(s => s.id !== id);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },
  
  getStudent: (id: string): StudentProfile | undefined => {
      return StorageService.getStudents().find(s => s.id === id);
  },

  // --- โจทย์ (แยก 2 โหมด) ---
  getAllQuestions: (): QuestionSet => {
      const daily = localStorage.getItem(KEYS.QUESTIONS_DAILY);
      const free = localStorage.getItem(KEYS.QUESTIONS_FREEPLAY);
      return {
          classroom: daily ? JSON.parse(daily) : [],
          freeplay: free ? JSON.parse(free) : []
      };
  },
  
  getDailyQuestions: (): MathQuestion[] => {
      const data = localStorage.getItem(KEYS.QUESTIONS_DAILY);
      return data ? JSON.parse(data) : [];
  },
  
  getFreeplayQuestions: (): MathQuestion[] => {
      const data = localStorage.getItem(KEYS.QUESTIONS_FREEPLAY);
      return data ? JSON.parse(data) : [];
  },

  saveQuestions: (questions: MathQuestion[], mode: 'CLASSROOM' | 'FREEPLAY') => {
      const key = mode === 'CLASSROOM' ? KEYS.QUESTIONS_DAILY : KEYS.QUESTIONS_FREEPLAY;
      localStorage.setItem(key, JSON.stringify(questions));
  },

  // --- การตั้งค่า (โรงเรียน, เพลง, พื้นหลัง) ---
  getGameConfig: (): GameConfig => {
    const data = localStorage.getItem(KEYS.CONFIG);
    const defaults: GameConfig = {
        schoolName: 'โรงเรียนบ้านหนองบัว',
        educationYear: '2567',
        bgmPlaylist: [],
        themeBackgrounds: {}
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },

  saveGameConfig: (config: GameConfig) => {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },
  
  resetFactory: () => {
      localStorage.clear();
      window.location.reload();
  }
};