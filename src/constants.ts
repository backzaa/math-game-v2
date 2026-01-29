// [แก้ไข] เติม type หลังคำว่า import
import type { TileConfig, ThemeConfig, ThemeId, MathQuestion } from './types';

// 30 Steps Layout (Snake Pattern)
export const BOARD_PATH_COORDS: {x: number, y: number}[] = [];

const ROWS = 5;
const COLS = 6;

for (let row = 0; row < ROWS; row++) {
  const y = 85 - (row * 16); 
  const isEvenRow = row % 2 === 0;
  
  for (let col = 0; col < COLS; col++) {
    const x = isEvenRow 
      ? 15 + (col * 14) 
      : 85 - (col * 14);
    
    BOARD_PATH_COORDS.push({ x, y });
  }
}

export const BOARD_TILES: TileConfig[] = BOARD_PATH_COORDS.map((coord, index) => {
  let type: any = 'NORMAL'; 
  if (index === 0) type = 'START';
  else if (index === BOARD_PATH_COORDS.length - 1) type = 'FINISH';
  return { type, x: coord.x, y: coord.y };
});

export const QUESTION_TILES_INDICES = []; 

export const MASTER_QUESTION_POOL: MathQuestion[] = Array.from({ length: 20 }, (_, i) => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ans = a + b;
    return {
        id: `def-${i}`,
        question: `${a} + ${b}`,
        answer: ans,
        options: [ans, ans+1, ans-1, ans+2].sort(() => Math.random() - 0.5)
    };
});

export const THEMES: Record<ThemeId, ThemeConfig> = {
  SPACE: {
    id: 'SPACE',
    name: 'ตะลุยอวกาศ',
    bgClass: 'theme-space', 
    primaryColor: '#3b82f6',
    secondaryColor: '#818cf8',
    pathColor: 'stroke-blue-400',
    tileColor: 'bg-blue-900',
    tileBorder: 'border-blue-400',
    decorations: ['⭐', '☄️', '🪐', '🛸', '✨', '🌑', '🌌', '🌠'],
    player1Char: 'ASTRONAUT',
    player2Char: 'ALIEN',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/10/25/audio_5475d12b52.mp3', 'https://cdn.pixabay.com/download/audio/2020/09/14/audio_3d02633036.mp3']
  },
  JUNGLE: {
    id: 'JUNGLE',
    name: 'ป่ามหัศจรรย์',
    bgClass: 'theme-jungle',
    primaryColor: '#22c55e',
    secondaryColor: '#f97316',
    pathColor: 'stroke-green-400',
    tileColor: 'bg-green-800',
    tileBorder: 'border-green-400',
    decorations: ['🌴', '🌿', '🌺', '🦜', '🐍', '🌊', '🍄', '🦋'],
    player1Char: 'EXPLORER',
    player2Char: 'MONKEY',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3']
  },
  OCEAN: {
    id: 'OCEAN',
    name: 'โลกใต้สมุทร',
    bgClass: 'theme-ocean',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    pathColor: 'stroke-cyan-300',
    tileColor: 'bg-cyan-900',
    tileBorder: 'border-cyan-300',
    decorations: ['🫧', '🐠', '🪸', '🐙', '🦀', '🐳', '🐚', '⚓'],
    player1Char: 'DIVER',
    player2Char: 'MERMAID',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/03/09/audio_c8c8a73467.mp3']
  },
  VOLCANO: {
    id: 'VOLCANO',
    name: 'ภูเขาไฟลาวา',
    bgClass: 'theme-volcano',
    primaryColor: '#ef4444',
    secondaryColor: '#f59e0b',
    pathColor: 'stroke-orange-500',
    tileColor: 'bg-red-900',
    tileBorder: 'border-orange-500',
    decorations: ['🔥', '🌋', '🪨', '🌫️', '🦖', '☄️', '🧨', '🌑'],
    player1Char: 'ROBOT',
    player2Char: 'DRAGON',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/03/10/audio_51472506b3.mp3']
  },
  CANDY: {
    id: 'CANDY',
    name: 'เมืองขนมหวาน',
    bgClass: 'theme-candy',
    primaryColor: '#ec4899',
    secondaryColor: '#a855f7',
    pathColor: 'stroke-pink-300',
    tileColor: 'bg-pink-600',
    tileBorder: 'border-white',
    decorations: ['🍭', '🍬', '🧁', '🍩', '🍪', '🍫', '🍧', '🍰'],
    player1Char: 'GINGERBREAD',
    player2Char: 'BEAR',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff131b.mp3']
  },
  PIRATE: {
    id: 'PIRATE',
    name: 'เกาะโจรสลัด',
    bgClass: 'theme-pirate',
    primaryColor: '#eab308',
    secondaryColor: '#78350f',
    pathColor: 'stroke-yellow-600',
    tileColor: 'bg-amber-900',
    tileBorder: 'border-yellow-600',
    decorations: ['☠️', '⚓', '🏝️', '🦈', '💰', '🗡️', '🌊', '🚢'],
    player1Char: 'PIRATE',
    player2Char: 'PARROT',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/05/23/audio_3345155f41.mp3']
  },
  CITY: {
    id: 'CITY',
    name: 'เมืองฮีโร่',
    bgClass: 'theme-city',
    primaryColor: '#3b82f6',
    secondaryColor: '#ef4444',
    pathColor: 'stroke-yellow-400',
    tileColor: 'bg-slate-800',
    tileBorder: 'border-yellow-400',
    decorations: ['🏢', '🚕', '💥', '🦸', '🚦', '🚓', '🌃', '🚁'],
    player1Char: 'SUPERHERO',
    player2Char: 'NINJA',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2021/11/24/audio_c35276332c.mp3']
  },
  DESERT: {
    id: 'DESERT',
    name: 'ทะเลทราย',
    bgClass: 'theme-desert',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    pathColor: 'stroke-amber-300',
    tileColor: 'bg-amber-800',
    tileBorder: 'border-amber-300',
    decorations: ['🌵', '🐫', '☀️', '🦂', '🏜️', '🏺', '🐍', '🦴'],
    player1Char: 'ARCHAEOLOGIST',
    player2Char: 'MUMMY',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/03/23/audio_07b629007f.mp3']
  },
  CASTLE: {
    id: 'CASTLE',
    name: 'ปราสาทเจ้าหญิง',
    bgClass: 'theme-castle',
    primaryColor: '#a855f7',
    secondaryColor: '#eab308',
    pathColor: 'stroke-purple-400',
    tileColor: 'bg-purple-900',
    tileBorder: 'border-purple-300',
    decorations: ['🏰', '🛡️', '👑', '🚩', '🌹', '🐎', '⚔️', '🕯️'],
    player1Char: 'PRINCESS',
    player2Char: 'KNIGHT',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2021/08/08/audio_c5a1a1c97a.mp3']
  },
  SKY: {
    id: 'SKY',
    name: 'วิมานเมฆ',
    bgClass: 'theme-sky',
    primaryColor: '#0ea5e9',
    secondaryColor: '#ffffff',
    pathColor: 'stroke-sky-300',
    tileColor: 'bg-sky-700',
    tileBorder: 'border-white',
    decorations: ['☁️', '🌈', '🕊️', '✨', '🎈', '🪁', '🦅', '☀️'],
    player1Char: 'FAIRY',
    player2Char: 'WIZARD',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2020/05/17/audio_1cd3518868.mp3']
  },
  WINTER: {
    id: 'WINTER',
    name: 'เมืองหิมะ',
    bgClass: 'theme-ocean',
    primaryColor: '#3b82f6',
    secondaryColor: '#ffffff',
    pathColor: 'stroke-white',
    tileColor: 'bg-blue-300',
    tileBorder: 'border-white',
    decorations: ['❄️', '⛄', '🎄', '🏂', '🧊', '🧣', '🐧', '🌨️'],
    player1Char: 'BEAR',
    player2Char: 'ASTRONAUT', 
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/11/21/audio_4588e99037.mp3']
  },
  FARM: {
    id: 'FARM',
    name: 'ฟาร์มสุขสันต์',
    bgClass: 'theme-jungle',
    primaryColor: '#eab308',
    secondaryColor: '#22c55e',
    pathColor: 'stroke-yellow-700',
    tileColor: 'bg-yellow-100',
    tileBorder: 'border-yellow-700',
    decorations: ['🐮', '🚜', '🌽', '🐔', '🌻', '🍎', '🥕', '🐄'],
    player1Char: 'COWBOY',
    player2Char: 'CACTUS',
    bgmUrls: ['https://cdn.pixabay.com/download/audio/2022/02/07/audio_1993427027.mp3']
  }
};

export const GAME_CONFIG = {
  maxTrapJump: 2, 
  pointsPerQuestion: 10, 
  pointsPerTreasure: 10,
  pointsPerSnack: 5,
};