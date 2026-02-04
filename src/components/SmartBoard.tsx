import React, { useState, useEffect, useRef } from 'react';
import type { PlayerState, TileType, MathQuestion, ThemeConfig, TileConfig, CharacterType } from '../types'; 
import { CharacterSvg } from './CharacterSvg';
import { MathModal } from './MathModal';
import { Trophy, LogOut, Settings, Home, Dices, Footprints, Flag, Zap, PlayCircle, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  player: PlayerState;
  theme: ThemeConfig;
  questions: MathQuestion[];
  onGameEnd: (finalDistance: number, score: number) => void;
  onExit: () => void;
}

const SFX = {
  WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  STEP: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3',
  CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  WRONG: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'
};

export const SmartBoard: React.FC<Props> = ({ 
  player, theme, questions,
  onGameEnd, onExit 
}) => {
  const currentThemeKey = (theme?.id || theme?.bgClass || 'default').toLowerCase().split(' ')[0];
  
  const getThemeColors = (type: TileType) => {
      if (type === 'START') return 'bg-green-500 border-green-700 text-white';
      switch(currentThemeKey) {
          case 'jungle': return 'bg-[#d4a373] border-[#8d5524] text-amber-900';
          case 'ocean': case 'boat': return 'bg-cyan-300 border-cyan-600 text-cyan-900';
          case 'volcano': return 'bg-orange-400 border-orange-700 text-orange-900';
          case 'space': return 'bg-slate-600 border-slate-800 text-slate-200';
          case 'candy': return 'bg-purple-300 border-purple-500 text-purple-900';
          default: return 'bg-slate-300 border-slate-500 text-slate-800';
      }
  };

  const getDirectImageLink = (url: string) => { 
      if (!url) return ''; 
      if (url.includes('drive.google.com') && url.includes('/d/')) { 
          const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/); 
          if (idMatch && idMatch[1]) return `https://docs.google.com/uc?export=view&id=${idMatch[1]}`; 
      } 
      return url; 
  };

  const getGradientStyle = () => { switch(currentThemeKey) { case 'space': return 'radial-gradient(circle at center, #1e293b 0%, #000000 100%)'; case 'jungle': return 'linear-gradient(to bottom, #14532d, #064e3b)'; case 'ocean': return 'linear-gradient(180deg, #0e7490 0%, #164e63 100%)'; case 'boat': return 'linear-gradient(to bottom, #38bdf8, #0ea5e9, #fde047)'; case 'volcano': return 'linear-gradient(to top, #450a0a, #7f1d1d)'; case 'candy': return 'radial-gradient(circle, #fbcfe8 0%, #db2777 100%)'; case 'castle': return 'linear-gradient(to bottom, #334155, #1e293b)'; default: return 'linear-gradient(to bottom, #475569, #334155)'; } };

  const [tiles, setTiles] = useState<TileConfig[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  const [gameState, setGameState] = useState<'READY' | 'START' | 'QUIZ' | 'ROLL' | 'MOVE' | 'FINISHED'>('READY');
  const [displayNumber, setDisplayNumber] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<MathQuestion | null>(null);
  
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const [isVideoBg, setIsVideoBg] = useState(false);
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  const spinIntervalRef = useRef<any>(null);

  useEffect(() => {
      const generateCurvedPath = (count: number) => { 
          const points = []; const rows = 5; const cols = Math.ceil(count / rows); 
          for (let i = 0; i < count; i++) { 
              const row = Math.floor(i / cols); const col = i % cols; const isReverseRow = row % 2 !== 0; 
              let x = isReverseRow ? 88 - (col * (76 / (cols - 1))) : 12 + (col * (76 / (cols - 1))); 
              let y = 82 - (row * (68 / (rows - 1))); 
              y += Math.sin(col * 0.5) * 2 + (Math.random() - 0.5) * 2; 
              points.push({ x, y }); 
          } return points; 
      };
      const pathCoords = generateCurvedPath(40);
      setTiles(pathCoords.map((coord, i) => ({ 
          x: coord.x, y: coord.y, 
          type: i === 0 ? 'START' : 'NORMAL'
      })));

      let finalBg = theme.themeBackgrounds?.[currentThemeKey] || null;
      let checkVideo = false;
      if (finalBg) { 
          finalBg = getDirectImageLink(finalBg); 
          if (finalBg.match(/\.(mp4|webm|ogg)$/i) || finalBg.includes('youtube.com') || finalBg.includes('youtu.be')) { checkVideo = true; } 
      }
      setBgUrl(finalBg);
      setIsVideoBg(checkVideo);

  }, [theme, currentThemeKey]);

  const handleUserInteract = () => {
      setHasInteracted(true);
      setGameState('START');
  };

  useEffect(() => {
      if (gameState === 'START' && tiles.length > 0) {
          setTimeout(() => {
              prepareNextQuestion();
          }, 800);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, tiles]);

  const prepareNextQuestion = () => {
      if (currentQuestionIdx >= 10) {
          finishGame();
          return;
      }
      setGameState('QUIZ');
      const q = questions[currentQuestionIdx] || {id:'err', question:'1+1', answer:2, options:[1,2,3,4]};
      setActiveQuestion(q);
  };

  const handleAnswer = (correct: boolean) => {
      setActiveQuestion(null);
      if (correct) {
          playSfx(SFX.CORRECT);
          setGameState('ROLL');
      } else {
          playSfx(SFX.WRONG);
          alert('เสียใจด้วย! อดเดินในรอบนี้');
          nextTurn();
      }
  };

  const handleDiceRoll = () => {
      if (gameState !== 'ROLL') return;
      
      setIsSpinning(true);
      spinIntervalRef.current = setInterval(() => setDisplayNumber(Math.floor(Math.random() * 6) + 1), 50);

      setTimeout(() => {
          if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
          const steps = Math.floor(Math.random() * 6) + 1;
          setDisplayNumber(steps);
          
          setTimeout(() => {
              setIsSpinning(false);
              setGameState('MOVE');
              startMove(steps);
          }, 500);
      }, 1500);
  };

  const startMove = (steps: number) => {
      setTotalDistance(prev => prev + steps);
      moveOneStep(steps, currentPosition);
  };

  const moveOneStep = (stepsRemaining: number, currentPos: number) => {
      if (stepsRemaining <= 0) {
          nextTurn();
          return;
      }

      playSfx(SFX.STEP);
      const nextPos = (currentPos + 1) % tiles.length;
      setCurrentPosition(nextPos);

      setTimeout(() => {
          moveOneStep(stepsRemaining - 1, nextPos);
      }, 400);
  };

  const nextTurn = () => {
      setCurrentQuestionIdx(prev => prev + 1);
      setGameState('START');
  };

  const finishGame = () => {
      setGameState('FINISHED');
      playSfx(SFX.WIN);
      confetti();
  };

  const playSfx = (url: string) => { 
      const audio = new Audio(url); 
      audio.volume = sfxVolume; 
      audio.play().catch(()=>{}); 
  };
  
  const generateSvgPath = (coords: {x:number, y:number}[]) => { if (coords.length === 0) return ""; let d = `M ${coords[0].x} ${coords[0].y}`; for (let i = 0; i < coords.length - 1; i++) { const next = coords[i+1]; d += ` L ${next.x} ${next.y}`; } return d; };
  const pathD = generateSvgPath(tiles);

  const progressPercent = Math.min(((currentQuestionIdx) / 10) * 100, 100);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col md:flex-row font-['Mali'] bg-black">
      
      {!hasInteracted && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-pop-in">
            <div className="bg-slate-800 p-8 rounded-3xl border-4 border-yellow-400 text-center shadow-2xl max-w-sm md:max-w-lg mx-4">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-6">พร้อมผจญภัยหรือยัง?</h1>
                <p className="text-slate-300 mb-8 text-lg">ภารกิจ: ตอบคำถาม 10 ข้อ เพื่อวิ่งให้ไกลที่สุด!</p>
                <button onClick={handleUserInteract} className="bg-green-600 hover:bg-green-500 text-white text-xl md:text-2xl font-bold px-8 py-4 md:px-12 md:py-6 rounded-full shadow-lg flex items-center gap-3 mx-auto animate-bounce hover:scale-110 transition">
                    <PlayCircle size={32} /> เริ่มเกมเลย!
                </button>
                <p className="text-slate-400 mt-6 text-xs md:text-sm">(แตะเพื่อเปิดเสียง)</p>
            </div>
        </div>
      )}

      <div className="absolute top-2 right-2 z-50">
          <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-900/80 p-2 rounded-full text-white border border-slate-700 hover:bg-slate-700 transition"><Settings size={24} /></button>
          {showSettings && (
              <div className="absolute right-0 mt-2 bg-slate-900/90 p-4 rounded-xl border border-slate-600 w-48 text-white z-50">
                  <div className="text-xs mb-2">BGM <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={e=>setBgmVolume(parseFloat(e.target.value))} className="w-full"/></div>
                  <div className="text-xs">SFX <input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={e=>setSfxVolume(parseFloat(e.target.value))} className="w-full"/></div>
              </div>
          )}
      </div>

      <div className="relative w-full h-[70%] md:w-[75%] md:h-full z-10 bg-slate-900 flex items-center justify-center overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-slate-700 shadow-2xl">
          <div className="absolute inset-0 z-0">
              {bgUrl ? (isVideoBg ? (<video src={bgUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<img src={bgUrl} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />)) : (<div className="w-full h-full" style={{ background: getGradientStyle() }} />)}
              <div className="absolute inset-0 bg-black/40"></div>
          </div>

          <button onClick={onExit} className="absolute top-4 left-4 z-50 bg-red-500/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><LogOut size={24} /></button>

          <div className="relative w-full h-full max-w-[100vh] max-h-[75vw] aspect-[4/3] m-4">
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={pathD} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1, 3" /></svg>
                
                {tiles.map((t, i) => (
                    <div key={i} className={`absolute w-[6%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm ${getThemeColors(t.type)} ${i === currentPosition ? 'ring-4 ring-yellow-300 z-20 scale-110' : 'scale-75 opacity-70'}`} style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                        {t.type === 'START' && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-green-600 px-2 rounded text-white shadow-md">START</div>}
                    </div>
                ))}

                {tiles.length > 0 && (
                    <div className="absolute w-[10%] aspect-square -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 ease-linear" style={{ left: `${tiles[currentPosition].x}%`, top: `${tiles[currentPosition].y - 5}%` }}>
                        <div className={`w-full h-full drop-shadow-2xl ${gameState === 'MOVE' ? 'animate-bounce' : ''}`}>
                            <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-pink-500 shadow-lg">
                                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                    {player.profileImage ? (
                                        <img src={player.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <CharacterSvg type={player.appearance?.base === 'BOY' ? (theme.player1Char as CharacterType) : (theme.player2Char as CharacterType)} className="w-full h-full" appearance={player.appearance} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
          </div>
      </div>

      <div className="relative w-full h-[30%] md:w-[25%] md:h-full z-20 bg-slate-900/95 backdrop-blur-md flex flex-row md:flex-col p-3 md:p-6 gap-3 md:gap-6 justify-between items-stretch shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
           
           <div className="flex-1 md:flex-none bg-slate-800/80 rounded-2xl border border-slate-600/50 p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={40} /></div>
               <div className="flex items-center gap-2 text-slate-300 text-xs md:text-sm uppercase font-bold mb-2">
                   <Zap size={16} className="text-yellow-400"/> ภารกิจ ({currentQuestionIdx}/10)
               </div>
               <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                   <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative" 
                        style={{ width: `${progressPercent}%` }}
                   >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                   </div>
               </div>
               <div className="text-right text-[10px] md:text-xs text-slate-400 mt-1">เหลืออีก {10 - currentQuestionIdx} ข้อ</div>
           </div>

           <div className="flex-[2] md:flex-1 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl border-2 border-indigo-500/30 p-2 md:p-6 shadow-xl flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
               
               <div className="text-center z-10">
                   <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs md:text-sm font-bold uppercase mb-1">
                       <Flag size={16}/> ระยะทางรวม
                   </div>
                   <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">
                       {totalDistance}
                   </div>
                   <div className="text-xs text-indigo-400">ก้าว</div>
               </div>

               <div className="z-10">
                   {gameState === 'ROLL' ? (
                        <button 
                            onClick={handleDiceRoll}
                            disabled={isSpinning}
                            className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-green-400 to-green-600 border-b-4 border-green-800 shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center justify-center animate-bounce group"
                        >
                            {isSpinning ? <Dices className="animate-spin text-white w-8 h-8 md:w-10 md:h-10"/> : <span className="text-2xl md:text-4xl font-black text-white">{displayNumber}</span>}
                        </button>
                   ) : (
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center opacity-50">
                            <Footprints className="text-slate-500" size={32}/>
                        </div>
                   )}
               </div>
           </div>

           <div className="hidden md:flex flex-col items-center bg-slate-800/80 rounded-3xl border-2 border-slate-600 p-4 shadow-lg relative">
                <div className="absolute -top-8 w-20 h-20 rounded-full border-4 border-white bg-slate-700 shadow-xl overflow-hidden">
                    {player.profileImage ? (
                        <img src={player.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <CharacterSvg type={player.appearance?.base === 'BOY' ? (theme.player1Char as CharacterType) : (theme.player2Char as CharacterType)} className="w-full h-full" appearance={player.appearance} />
                    )}
                </div>
                <div className="mt-12 text-center w-full">
                    <h2 className="text-xl font-bold text-white truncate">{player.nickname || player.firstName}</h2>
                    <div className="bg-slate-900/50 rounded-full px-3 py-1 mt-2 inline-flex items-center gap-2">
                        <Star size={14} className="text-yellow-400"/>
                        <span className="text-sm text-yellow-100 font-bold">{player.score} คะแนน</span>
                    </div>
                </div>
           </div>
           
           <div className="md:hidden flex items-center gap-2 bg-slate-800/80 rounded-xl p-2 border border-slate-600">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-700">
                    {player.profileImage ? (
                        <img src={player.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <CharacterSvg type={player.appearance?.base === 'BOY' ? (theme.player1Char as CharacterType) : (theme.player2Char as CharacterType)} className="w-full h-full" appearance={player.appearance} />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white w-16 truncate">{player.nickname}</span>
                    <span className="text-[10px] text-yellow-400">⭐ {player.score}</span>
                </div>
           </div>

      </div>

      {gameState === 'QUIZ' && activeQuestion && (
          <MathModal 
            question={activeQuestion} 
            onAnswer={handleAnswer} 
            volume={sfxVolume} 
            calculatorUsesLeft={2}
            onConsumeCalculator={()=>{}}
            compact={true} 
          />
      )}

      {gameState === 'FINISHED' && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[2000] animate-pop-in">
             <div className="text-center p-8 bg-slate-800 rounded-3xl border-4 border-yellow-500 shadow-2xl max-w-sm w-full relative">
                <Trophy size={100} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                <h1 className="text-4xl font-black text-white mb-2">จบเกม!</h1>
                <p className="text-slate-400 mb-6">คุณวิ่งได้ระยะทางทั้งหมด</p>
                <div className="bg-black/50 p-6 rounded-2xl border border-yellow-500/30 mb-8">
                    <div className="text-6xl font-black text-green-400 drop-shadow-glow">{totalDistance}</div>
                    <div className="text-sm text-slate-500 mt-2">ก้าว</div>
                </div>
                <button onClick={() => onGameEnd(totalDistance, totalDistance * 10)} className="bg-blue-600 w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg hover:scale-105 transition flex items-center justify-center gap-2">
                    <Home size={24} /> บันทึกและกลับหน้าหลัก
                </button>
             </div>
         </div>
      )}

    </div>
  );
};