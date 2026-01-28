// ใช้ import type เพื่อแก้ปัญหา 'must be imported using a type-only import'
import type { ThemeConfig, MathQuestion } from './types';

// ค่าคงที่สำหรับเกม
export const TOTAL_STEPS = 20;
export const WIN_SCORE = 20;

// รายชื่อธีม (Themes) - ใส่ pathColor ให้ครบเพื่อแก้ Error
export const THEMES: ThemeConfig[] = [
  {
    id: 'space',
    name: 'ตะลุยอวกาศ',
    bgClass: 'bg-slate-900',
    primaryColor: '#6366f1', // Indigo
    secondaryColor: '#1e293b', // Slate-800
    pathColor: '#94a3b8', // สีเส้นทางเดิน
    decorations: ['🚀', '⭐', '🪐', '☄️'],
    bgmUrls: []
  },
  {
    id: 'jungle',
    name: 'ป่าดงดิบ',
    bgClass: 'bg-green-900',
    primaryColor: '#16a34a', // Green
    secondaryColor: '#14532d', // Green-900
    pathColor: '#86efac', 
    decorations: ['🌴', '🐒', '🌺', '🦜'],
    bgmUrls: []
  },
  {
    id: 'ocean',
    name: 'มหาสมุทร',
    bgClass: 'bg-blue-900',
    primaryColor: '#06b6d4', // Cyan
    secondaryColor: '#0c4a6e', // Sky-900
    pathColor: '#67e8f9',
    decorations: ['🐳', '🐙', '🐚', '🌊'],
    bgmUrls: []
  },
  {
    id: 'candy',
    name: 'ดินแดนขนมหวาน',
    bgClass: 'bg-pink-900',
    primaryColor: '#ec4899', // Pink
    secondaryColor: '#831843', // Pink-900
    pathColor: '#fbcfe8',
    decorations: ['🍭', '🧁', '🍩', '🍬'],
    bgmUrls: []
  },
  {
    id: 'castle',
    name: 'ปราสาทอัศวิน',
    bgClass: 'bg-slate-700',
    primaryColor: '#f59e0b', // Amber
    secondaryColor: '#451a03', // Amber-900
    pathColor: '#cbd5e1',
    decorations: ['🏰', '⚔️', '🛡️', '🐉'],
    bgmUrls: []
  },
  {
    id: 'volcano',
    name: 'ภูเขาไฟ',
    bgClass: 'bg-red-950',
    primaryColor: '#dc2626', // Red
    secondaryColor: '#7f1d1d', // Red-900
    pathColor: '#fca5a5',
    decorations: ['🌋', '🔥', '☄️', '🦖'],
    bgmUrls: []
  }
];

// โจทย์สำรอง (กรณีเน็ตหลุดหรือโหลดไม่ได้)
export const DEFAULT_QUESTIONS: MathQuestion[] = [
  {
    id: 'q1',
    question: '5 + 3',
    answer: 8,
    type: 'ADD',
    difficulty: 1,
    options: [7, 8, 9, 10]
  },
  {
    id: 'q2',
    question: '10 - 4',
    answer: 6,
    type: 'SUBTRACT',
    difficulty: 1,
    options: [4, 5, 6, 7]
  },
  {
    id: 'q3',
    question: '2 x 3',
    answer: 6,
    type: 'MULTIPLY',
    difficulty: 1,
    options: [5, 6, 8, 9]
  },
  {
    id: 'q4',
    question: '12 ÷ 2',
    answer: 6,
    type: 'DIVIDE',
    difficulty: 1,
    options: [4, 5, 6, 8]
  },
  {
    id: 'q5',
    question: '7 + 6',
    answer: 13,
    type: 'ADD',
    difficulty: 1,
    options: [11, 12, 13, 14]
  }
];