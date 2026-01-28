export type UserRole = 'STUDENT' | 'TEACHER';
export type ScoringMode = 'CLASSROOM' | 'FREEPLAY';
export type CharacterType = 'BOY' | 'GIRL' | 'ASTRONAUT' | 'ALIEN' | 'SUPERHERO' | 'NINJA' | 'PRINCESS';

export interface CharacterAppearance {
  base: CharacterType;
  skinColor: string;
  hairStyle?: string;
  hairColor?: string;
  accessories?: string[];
}

export interface PlayerState {
  id: string;
  firstName?: string;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  character: CharacterType;
  appearance?: CharacterAppearance;
  classroom?: string;
  score: number;
  position: number;
  calculatorUsesLeft: number;
  isFinished: boolean;
  sessions?: GameSession[];
  profileImage?: string; 
}

export interface MathQuestion {
  id: string;
  question: string;
  answer: number;
  type: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';
  difficulty: number;
}

// [แก้ไข] เพิ่ม questionId และปรับให้ตรงกับที่ GameBoard ใช้
export interface QuestionDetail {
  questionId: string;    // เพิ่มบรรทัดนี้
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: string;
}

export interface GameSession {
  sessionId: string;
  date: string;
  timestamp: string;
  score: number;
  mode: ScoringMode;
  details: QuestionDetail[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  bgClass: string;
  primaryColor: string;
  secondaryColor: string;
  decorations: string[];
  bgmUrls: string[];
}

export interface StudentProfile extends PlayerState {
  totalScore?: number;
}