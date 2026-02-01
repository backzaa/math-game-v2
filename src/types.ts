export type UserRole = 'STUDENT' | 'TEACHER';
export type CharacterBase = 'BOY' | 'GIRL';
export type SkinColor = '#fca5a5' | '#fcd34d' | '#8d5524' | '#e0ac69'; 
export type CharacterType = 'ASTRONAUT' | 'ALIEN' | 'SUPERHERO' | 'NINJA' | 'PRINCESS';
export type TileType = 'START' | 'FINISH' | 'NORMAL' | 'QUESTION' | 'TREASURE' | 'TRAP';
export type ScoringMode = 'CLASSROOM' | 'FREEPLAY'; 
export type Gender = 'MALE' | 'FEMALE';
export type ThemeId = 'SPACE' | 'JUNGLE' | 'OCEAN' | 'VOLCANO' | 'CANDY' | 'PIRATE' | 'CITY' | 'DESERT' | 'CASTLE' | 'SKY' | 'WINTER' | 'FARM';

export interface ThemeConfig {
  id: string;
  name: string;
  bgClass: string; 
  primaryColor: string;
  secondaryColor: string;
  decorations: string[];
  bgmUrls: string[];
  pathColor?: string;
  tileColor?: string;
  tileBorder?: string;
  player1Char?: string;
  player2Char?: string;
  themeBackgrounds?: Record<string, string>;
}

export interface CharacterAppearance {
  base: CharacterBase;
  skinColor: SkinColor;
}

export interface QuestionDetail {
    questionText: string;
    isCorrect: boolean;
    scoreEarned: number;
}

export interface GameSession {
    sessionId: string;
    date: string;       
    score: number;
    mode: ScoringMode;
    timestamp: string;
    details: QuestionDetail[]; 
    isManual?: boolean;
    note?: string;
    // [เพิ่ม] รองรับข้อมูลจาก Google Sheets
    realScore?: number;
    bonusScore?: number;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: Gender;
  classroom: string;
  profileImage?: string;
  appearance: CharacterAppearance;
  sessions: GameSession[]; 
}

export interface PlayerState extends StudentProfile {
  position: number;
  score: number;
  character: string; 
  calculatorUsesLeft: number;
  isFinished: boolean;
}

export interface MathQuestion {
  id: string;
  question: string;
  answer: number;
  options: number[];
}

export interface QuestionLog {
  questionId: string;
  questionText: string;
  correctAnswer: number;
  studentAnswer: number;
  isCorrect: boolean;
  timestamp: string;
}

export interface TileConfig {
    x: number;
    y: number;
    type: TileType;
}

export interface DailyQuestionSet {
    date: string;
    questions: MathQuestion[];
}

export interface GameGlobalConfig {
    themeBackgrounds: Record<string, string>; 
    bgmPlaylist: string[];
    menuPlaylist?: string[];    // [เพิ่มใหม่] เพลงตอนอยู่หน้าเมนู
}