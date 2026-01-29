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

// [จุดที่หายไป] ต้องมี PlayerState ตรงนี้ครับ
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

export interface QuestionDetail {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: string;
  scoreEarned?: number;
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

export interface GameConfig {
  schoolName: string;
  educationYear: string;
  bgmPlaylist: string[];
  themeBackgrounds: Record<string, string>; 
}

export interface QuestionSet {
  classroom: MathQuestion[];
  freeplay: MathQuestion[];
}

// [ประเภทข้อมูลใหม่สำหรับแผนที่]
export type TileType = 'START' | 'FINISH' | 'NORMAL' | 'QUESTION' | 'TREASURE' | 'TRAP';

export interface TileConfig {
    x: number;
    y: number;
    type: TileType;
}

export interface QuestionLog {
    id: string;
    text: string;
    isCorrect: boolean;
    timestamp: number;
}