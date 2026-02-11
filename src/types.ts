// src/types.ts

// ประเภทผู้ใช้งาน
export type UserRole = 'TEACHER' | 'STUDENT';
export type Gender = 'MALE' | 'FEMALE';

// ข้อมูลการเล่นแต่ละครั้ง (Session)
export interface QuestionDetail {
    questionText: string;
    isCorrect: boolean;
    scoreEarned: number;
}

export interface GameSession {
    sessionId: string;
    date: string;
    timestamp: string;
    score: number;
    realScore: number;
    bonusScore: number;
    mode: ScoringMode;
    details?: QuestionDetail[]; // รายละเอียดแต่ละข้อ
    gameType?: GameType;       // 'CLASSIC' หรือ 'RALLY'
    totalDistance?: number;    // สำหรับ Rally
    duration?: number;         // เวลาที่ใช้เล่น (วินาที)
    guestName?: string | null; // ชื่อ Guest (ถ้ามี)
}

// ข้อมูลนักเรียน (เปลี่ยนชื่อให้สั้นลง แต่รองรับชื่อเดิมด้วย)
export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string;
    gender: Gender;
    classroom: string;
    profileImage?: string;
    totalScore?: number; // คะแนนรวมสะสม
    sessions?: GameSession[];
    appearance?: {
        base: string;
        skinColor: string;
    };
}
// Alias ให้ชื่อเก่า (StudentProfile) ใช้ได้เหมือนกัน (กัน Error ไฟล์อื่น)
export type StudentProfile = Student; 

// โจทย์เลข
export interface MathQuestion {
    id: string;
    question: string;
    answer: number;
    options: number[];
    type?: 'DAILY' | 'FREEPLAY';
}

// การตั้งค่าเกม
export interface ThemeConfig {
    id: string;
    name: string;
    bgClass: string;
    primaryColor: string;
    secondaryColor: string;
    decorations: string[];
    bgmUrls: string[];
}

export interface GameConfig {
    themeBackgrounds?: Record<string, string>; // map themeId -> url
    bgmPlaylist?: string[];
    menuPlaylist?: string[];
}
// Alias ชื่อเก่า
export type GameGlobalConfig = GameConfig;

// สถานะผู้เล่นในบอร์ดเกม
export interface PlayerState extends Student {
    position: number;     // ช่องปัจจุบัน (0-based)
    score: number;        // คะแนนในเกมนี้
    character: string;    // ตัวละครที่เลือก
    calculatorUsesLeft: number; // จำนวนครั้งที่ใช้เครื่องคิดเลขได้
    isFinished: boolean;  // เข้าเส้นชัยหรือยัง
}

// โหมดการเล่น
export type ScoringMode = 'CLASSROOM' | 'FREEPLAY';
export type GameType = 'CLASSIC' | 'RALLY';

// ประวัติการแลกรางวัล
export interface RedemptionRecord {
    id?: string;        // Firebase ID
    timestamp: string;
    studentId: string;
    rewardName: string;
    pointsSpent: number;
    teacherName: string;
}

export interface StudentBalance {
    totalScore: number;
    totalRedeemed: number;
    currentBalance: number;
}