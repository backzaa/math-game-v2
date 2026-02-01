import React, { useState, useEffect, useRef } from 'react';
import type { PlayerState, TileType, MathQuestion, ThemeConfig, TileConfig, QuestionDetail, ScoringMode, CharacterType } from '../types'; 
import { StorageService } from '../services/storage'; 
import { CharacterSvg } from './CharacterSvg';
import { MathModal } from './MathModal';
import { Trophy, LogOut, Settings, Home, Music, SkipForward, Play, Pause, PlayCircle, Dices, Footprints } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  players: PlayerState[];
  currentPlayerIndex: number;
  theme: ThemeConfig;
  questions: MathQuestion[];
  gameMode: ScoringMode;
  onTurnComplete: (newPlayers: PlayerState[], nextIndex: number) => void;
  onQuestionAnswered: (detail: QuestionDetail) => void;
  onGameEnd: () => void;
  onExit: () => void;
}

const SFX = {
  WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  TREASURE: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  STEP: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'
};

const THEME_ASSETS: any = {
    castle: { bg: '', bgm: '' },
    jungle: { bg: '', bgm: '' },
    space: { bg: '', bgm: '' },
    boat: { bg: '', bgm: '' },
    ocean: { bg: '', bgm: '' },
    volcano: { bg: '', bgm: '' },
    candy: { bg: '', bgm: '' },
    default: { bg: '', bgm: '' }
};

const GAME_CONFIG = {
    pointsPerQuestion: 10,
    pointsPerTreasure: 10
};

export const GameBoard: React.FC<Props> = ({ 
  players, currentPlayerIndex, theme, gameMode,
  onTurnComplete, onQuestionAnswered, onGameEnd, onExit 
}) => {
  const currentThemeKey = (theme?.id || theme?.bgClass || 'default').toLowerCase().split(' ')[0];
  const defaultAssets = THEME_ASSETS[Object.keys(THEME_ASSETS).find(k => currentThemeKey.includes(k)) || 'default'];

  const getThemeColors = (type: TileType) => {
      if (type === 'TREASURE') return 'bg-yellow-400 border-yellow-600 text-yellow-900 animate-pulse-slow';
      if (type === 'TRAP') return 'bg-black border-slate-700 text-white animate-pulse-slow';
      if (type === 'START') return 'bg-green-500 border-green-700 text-white';
      if (type === 'FINISH') return 'bg-red-500 border-red-700 text-white';

      switch(currentThemeKey) {
          case 'jungle': return type === 'QUESTION' ? 'bg-green-600 border-green-800 text-white' : 'bg-[#d4a373] border-[#8d5524] text-amber-900';
          case 'ocean': case 'boat': return type === 'QUESTION' ? 'bg-blue-600 border-blue-800 text-white' : 'bg-cyan-300 border-cyan-600 text-cyan-900';
          case 'volcano': return type === 'QUESTION' ? 'bg-red-600 border-red-900 text-white' : 'bg-orange-400 border-orange-700 text-orange-900';
          case 'space': return type === 'QUESTION' ? 'bg-indigo-600 border-indigo-900 text-white' : 'bg-slate-600 border-slate-800 text-slate-200';
          case 'candy': return type === 'QUESTION' ? 'bg-pink-500 border-pink-700 text-white' : 'bg-purple-300 border-purple-500 text-purple-900';
          default: return type === 'QUESTION' ? 'bg-slate-600 border-slate-800 text-white' : 'bg-slate-300 border-slate-500 text-slate-800';
      }
  };

  const getDirectAudioLink = (url: string) => { if (!url) return ''; if (url.includes('dropbox.com')) return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', ''); if (url.includes('drive.google.com') && url.includes('/d/')) { const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/); if (idMatch && idMatch[1]) return `https://docs.google.com/uc?export=download&id=${idMatch[1]}`; } return url; };
  const getDirectImageLink = (url: string) => { if (!url) return ''; if (url.includes('drive.google.com') && url.includes('/d/')) { const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/); if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`; } return url; };
  const getGradientStyle = () => { switch(currentThemeKey) { case 'space': return 'radial-gradient(circle at center, #1e293b 0%, #000000 100%)'; case 'jungle': return 'linear-gradient(to bottom, #14532d, #064e3b)'; case 'ocean': return 'linear-gradient(180deg, #0e7490 0%, #164e63 100%)'; case 'boat': return 'linear-gradient(to bottom, #38bdf8, #0ea5e9, #fde047)'; case 'volcano': return 'linear-gradient(to top, #450a0a, #7f1d1d)'; case 'candy': return 'radial-gradient(circle, #fbcfe8 0%, #db2777 100%)'; case 'castle': return 'linear-gradient(to bottom, #334155, #1e293b)'; default: return 'linear-gradient(to bottom, #475569, #334155)'; } };
  
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  };

  const [bgmVolume, setBgmVolume] = useState(isMobileDevice() ? 0.8 : (0.8 * 0.7));
  const [sfxVolume, setSfxVolume] = useState(isMobileDevice() ? 0.3 : (0.4 * 0.7));
  const [showSettings, setShowSettings] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [activeAssets, setActiveAssets] = useState<{ bg: string | null, bgmPlaylist: string[] }>({ bg: null, bgmPlaylist: [] });
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const [audioError, setAudioError] = useState(false);
  const [isVideoBg, setIsVideoBg] = useState(false);

  const [gameQuestions, setGameQuestions] = useState<MathQuestion[]>([]);
  const [localPlayers, setLocalPlayers] = useState<PlayerState[]>(() => {
    const saved = localStorage.getItem('math_game_session_players');
    return saved ? JSON.parse(saved) : players;
  });
  const [localCurrentIndex, setLocalCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('math_game_session_index');
    return saved ? parseInt(saved) : currentPlayerIndex;
  });
  const [tiles, setTiles] = useState<TileConfig[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<MathQuestion | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [pendingSteps, setPendingSteps] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<{type: 'WIN'|'TREASURE'|'TRAP', msg: string} | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(1);
  const [trapBackSteps, setTrapBackSteps] = useState(0);
  const [isFinishingTurn, setIsFinishingTurn] = useState(false);
  
  const spinIntervalRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any>(null); 
  const playersRef = useRef(localPlayers);

  const fadeAudio = (targetVolume: number, duration: number, onComplete?: () => void) => {
    if (!audioRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const startVolume = audioRef.current.volume;
    const startTime = Date.now();
    const audio = audioRef.current;

    fadeIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const newVolume = startVolume + (targetVolume - startVolume) * progress;
        
        if (audio) audio.volume = Math.max(0, Math.min(1, newVolume));

        if (progress >= 1) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            if (onComplete) onComplete();
        }
    }, 50);
  };

  useEffect(() => { 
      if (gameMode === 'CLASSROOM') { 
          const daily = StorageService.getDailyQuestions(); 
          setGameQuestions((daily && daily.length > 0) ? daily : [{id:'def', question:'1+1', answer:2, options:[1,2,3,4]}]); 
      } else { 
          const pool = StorageService.getFreeplayQuestions(); 
          if (pool.length > 0) { const shuffled = [...pool].sort(() => 0.5 - Math.random()); setGameQuestions(shuffled.slice(0, 10)); } 
          else { setGameQuestions([{id:'free', question:'2+2', answer:4, options:[3,4,5,6]}]); } 
      } 
      const customConfig = StorageService.getGameConfig(); const specificBg = customConfig?.themeBackgrounds?.[currentThemeKey]; const playlist = (customConfig?.bgmPlaylist && customConfig.bgmPlaylist.length > 0) ? customConfig.bgmPlaylist : []; let finalBg = specificBg && specificBg.trim() !== '' ? specificBg : null; let checkVideo = false; if (finalBg) { finalBg = getDirectImageLink(finalBg); if (finalBg.match(/\.(mp4|webm|ogg)$/i) || finalBg.includes('youtube.com') || finalBg.includes('youtu.be')) { checkVideo = true; } } setActiveAssets({ bg: finalBg, bgmPlaylist: playlist }); setIsVideoBg(checkVideo); 
      
      // [แก้ไข 1] สุ่มเพลงเมื่อเริ่มเกม
      if (playlist.length > 0) { 
        setCurrentSongIndex(Math.floor(Math.random() * playlist.length)); 
      } 
  }, [theme, currentThemeKey, defaultAssets, gameMode]);
  
  useEffect(() => { 
    if (hasInteracted && activeAssets.bgmPlaylist.length > 0 && audioRef.current) { 
        const rawLink = activeAssets.bgmPlaylist[currentSongIndex]; 
        const directLink = getDirectAudioLink(rawLink); 
        
        if (audioRef.current.src !== directLink) { 
            audioRef.current.src = directLink; 
            audioRef.current.load(); 
            const playPromise = audioRef.current.play(); 
            if (playPromise !== undefined) { 
                audioRef.current.volume = 0;
                playPromise.then(() => { 
                    setIsPlaying(true); 
                    setAudioError(false); 
                    fadeAudio(bgmVolume, 2000); 
                }).catch(error => { 
                    console.log("Auto-play prevented", error); 
                    setIsPlaying(false); 
                    setAudioError(true); 
                }); 
            } 
        } else {
            if (isPlaying) {
                audioRef.current.play().catch(()=>{});
                if (audioRef.current.volume < bgmVolume) fadeAudio(bgmVolume, 1000);
            } else {
                audioRef.current.pause();
            }
        }
    } 
  }, [currentSongIndex, activeAssets.bgmPlaylist, hasInteracted, isPlaying]);

  useEffect(() => { 
    if (audioRef.current && !fadeIntervalRef.current) { 
        audioRef.current.volume = bgmVolume; 
    } 
  }, [bgmVolume]);

  const handleUserInteract = () => { setHasInteracted(true); setIsPlaying(true); };
  const handleNextSong = () => { if (activeAssets.bgmPlaylist.length > 0) { setCurrentSongIndex((prev) => (prev + 1) % activeAssets.bgmPlaylist.length); } };
  const handleSelectSong = (index: number) => { setCurrentSongIndex(index); setIsPlaying(true); setShowMusicMenu(false); setAudioError(false); };
  const forcePlayAudio = () => { setAudioError(false); setIsPlaying(true); if(audioRef.current) audioRef.current.play().catch(e => console.error(e)); };

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
      
      const getValidIndices = (count: number, minGap: number, occupied: number[]) => {
          for(let attempt=0; attempt<500; attempt++) {
              const selected: number[] = [];
              const candidates = Array.from({length: 38}, (_, i) => i + 1).filter(i => !occupied.includes(i));
              
              for (let i = candidates.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
              }

              for(const idx of candidates) {
                  if (selected.length >= count) break;
                  const isFarEnough = selected.every(s => Math.abs(s - idx) >= minGap);
                  if (isFarEnough) selected.push(idx);
              }

              if (selected.length === count) return selected;
          }
          const fallback: number[] = [];
          const pool = Array.from({length: 38}, (_, i) => i + 1).filter(i => !occupied.includes(i));
          while(fallback.length < count && pool.length > 0) {
              const idx = Math.floor(Math.random() * pool.length);
              fallback.push(pool[idx]);
              pool.splice(idx, 1);
          }
          return fallback;
      };

      const qIndices = getValidIndices(10, 3, []);
      const tIndices = getValidIndices(4, 7, qIndices);
      const trapIndices = getValidIndices(3, 10, [...qIndices, ...tIndices]);

      const finalTypes: TileType[] = Array(40).fill('NORMAL');
      finalTypes[0] = 'START';
      finalTypes[39] = 'FINISH';
      qIndices.forEach(idx => finalTypes[idx] = 'QUESTION');
      tIndices.forEach(idx => finalTypes[idx] = 'TREASURE');
      trapIndices.forEach(idx => finalTypes[idx] = 'TRAP');

      setTiles(pathCoords.map((coord, i) => ({ x: coord.x, y: coord.y, type: finalTypes[i] }))); 
  }, []);
  
  useEffect(() => { localStorage.setItem('math_game_session_players', JSON.stringify(localPlayers)); localStorage.setItem('math_game_session_index', localCurrentIndex.toString()); }, [localPlayers, localCurrentIndex]);
  useEffect(() => { playersRef.current = localPlayers; }, [localPlayers]);
  
  const playSfx = (url: string) => { 
      const audio = new Audio(url); 
      audio.volume = sfxVolume; 
      audio.play().catch(()=>{}); 
  };

  const handleAction = () => { 
      if (gameFinished || isSpinning || isMoving || activeQuestion || activeOverlay) return;
      if (pendingSteps > 0) { resumeMove(); return; } 
      
      setIsSpinning(true); 
      spinIntervalRef.current = setInterval(() => setDisplayNumber(Math.floor(Math.random() * 6) + 1), 50);
      
      setTimeout(() => { 
          if(spinIntervalRef.current) clearInterval(spinIntervalRef.current); 
          const result = Math.floor(Math.random() * 6) + 1; 
          setDisplayNumber(result); 
          
          setTimeout(() => { 
              setIsSpinning(false); 
              startMove(result); 
          }, 500); 
      }, 1500);
  };
  const startMove = (steps: number) => moveOneStep(steps, playersRef.current[localCurrentIndex].position);
  const moveOneStep = (stepsRemaining: number, currentPos: number) => { if (stepsRemaining <= 0) { setIsMoving(false); const tile = tiles[currentPos]; if (tile?.type === 'TREASURE') handleTileEvent('TREASURE'); else if (tile?.type === 'QUESTION' && pendingSteps === 0) handleTileEvent('QUESTION'); else endTurn(); return; } setIsMoving(true); playSfx(SFX.STEP); const nextPos = Math.min(currentPos + 1, tiles.length - 1); const newPlayers = [...playersRef.current]; newPlayers[localCurrentIndex] = { ...newPlayers[localCurrentIndex], position: nextPos }; setLocalPlayers(newPlayers); onTurnComplete(newPlayers, localCurrentIndex); setTimeout(() => { const tile = tiles[nextPos]; if (tile?.type === 'FINISH') { setIsMoving(false); setGameFinished(true); confetti(); playSfx(SFX.WIN); return; } if (tile?.type === 'QUESTION') { setIsMoving(false); setPendingSteps(stepsRemaining - 1); handleTileEvent('QUESTION'); return; } if (tile?.type === 'TRAP' && stepsRemaining === 1) { setIsMoving(false); setPendingSteps(0); handleTileEvent('TRAP'); return; } moveOneStep(stepsRemaining - 1, nextPos); }, 500); };
  
  const handleTileEvent = (type: TileType) => { 
      if (type === 'QUESTION') setActiveQuestion(gameQuestions[Math.floor(Math.random() * gameQuestions.length)]); 
      else if (type === 'TREASURE') { 
          playSfx(SFX.TREASURE); 
          const bonus = GAME_CONFIG.pointsPerTreasure; 
          setActiveOverlay({ type: 'TREASURE', msg: `เจอสมบัติ! +${bonus} คะแนน` }); 
          const newPlayers = [...playersRef.current]; 
          newPlayers[localCurrentIndex].score += bonus; 
          setLocalPlayers(newPlayers); 
      } 
      else if (type === 'TRAP') { const back = Math.floor(Math.random() * 3) + 1; setTrapBackSteps(back); setActiveOverlay({ type: 'TRAP', msg: `โดนกับดัก! ถอยหลัง ${back} ช่อง` }); } 
  };
  
  const resumeMove = () => { 
      const isTrap = activeOverlay?.type === 'TRAP'; 
      const currentPos = playersRef.current[localCurrentIndex].position; 
      
      setActiveOverlay(null); 
      setActiveQuestion(null); 
      
      setIsMoving(true); 

      if (isTrap) { 
          const backPos = Math.max(0, currentPos - trapBackSteps); 
          const newPlayers = [...playersRef.current]; 
          newPlayers[localCurrentIndex].position = backPos; 
          setLocalPlayers(newPlayers); 
          
          setTimeout(() => {
              setIsMoving(false); 
              endTurn();
          }, 500); 
          return; 
      } 
      
      if (pendingSteps > 0) { 
          const steps = pendingSteps;
          setPendingSteps(0); 
          setTimeout(() => moveOneStep(steps, playersRef.current[localCurrentIndex].position), 500); 
      } else { 
          setIsMoving(false); 
          endTurn();
      }
  };

  const endTurn = () => { 
      setIsFinishingTurn(true); 
      setTimeout(() => {
          setIsFinishingTurn(false); 
          const nextIndex = (localCurrentIndex + 1) % localPlayers.length; 
          setLocalCurrentIndex(nextIndex); 
          setDisplayNumber(1); 
      }, 800); 
  };
  
  const handleAnswer = (correct: boolean, usedCalculator: boolean) => { 
      if (activeQuestion) { 
          const fullScore = GAME_CONFIG.pointsPerQuestion;
          const score = correct ? (usedCalculator ? fullScore / 2 : fullScore) : 0; 
          onQuestionAnswered({ questionText: activeQuestion.question, isCorrect: correct, scoreEarned: score }); 
          if (correct) { 
              const newPlayers = [...playersRef.current]; newPlayers[localCurrentIndex].score += score; 
              if (usedCalculator && newPlayers[localCurrentIndex].calculatorUsesLeft > 0) { newPlayers[localCurrentIndex].calculatorUsesLeft -= 1; }
              setLocalPlayers(newPlayers); 
          } 
      } 
      resumeMove(); 
  };
  
  const handleConsumeCalculator = () => { const newPlayers = [...playersRef.current]; if (newPlayers[localCurrentIndex].calculatorUsesLeft > 0) { newPlayers[localCurrentIndex].calculatorUsesLeft -= 1; setLocalPlayers(newPlayers); } };
  
  const generateSvgPath = (coords: {x:number, y:number}[]) => { if (coords.length === 0) return ""; let d = `M ${coords[0].x} ${coords[0].y}`; for (let i = 0; i < coords.length - 1; i++) { const next = coords[i+1]; d += ` L ${next.x} ${next.y}`; } return d; };
  const pathD = generateSvgPath(tiles);
  const currentPlayer = localPlayers[localCurrentIndex];
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col md:flex-row font-['Mali'] bg-black">
      
      {!hasInteracted && (<div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-pop-in"><div className="bg-slate-800 p-8 rounded-3xl border-4 border-yellow-400 text-center shadow-2xl max-w-sm md:max-w-lg mx-4"><h1 className="text-3xl md:text-4xl font-black text-white mb-6">พร้อมผจญภัยหรือยัง?</h1><button onClick={handleUserInteract} className="bg-green-600 hover:bg-green-500 text-white text-xl md:text-2xl font-bold px-8 py-4 md:px-12 md:py-6 rounded-full shadow-lg flex items-center gap-3 mx-auto animate-bounce hover:scale-110 transition"><PlayCircle size={32} /> เริ่มเกมเลย!</button><p className="text-slate-400 mt-6 text-xs md:text-sm">(แตะเพื่อเปิดเสียง)</p></div></div>)}
      <audio ref={audioRef} onEnded={handleNextSong} crossOrigin="anonymous" className="hidden" />
      {audioError && hasInteracted && (<div className="absolute top-16 md:top-20 right-4 z-50 animate-bounce"><button onClick={forcePlayAudio} className="bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-full font-bold shadow-lg flex items-center gap-2 text-xs md:text-base"><Music className="animate-pulse" size={16}/> เล่นเพลง</button></div>)}

      {/* Controls */}
      <div className="absolute top-2 md:top-4 right-2 md:right-4 z-50 flex flex-col items-end gap-2">
          {activeAssets.bgmPlaylist.length > 0 && (<div className="relative"><button onClick={() => setShowMusicMenu(!showMusicMenu)} className="bg-slate-900/80 p-2 md:p-3 rounded-full text-white hover:bg-slate-800 shadow-lg border border-slate-700"><Music size={20} className={isPlaying ? "animate-pulse text-green-400" : "text-slate-400"} /></button>{showMusicMenu && (<div className="absolute right-0 mt-2 bg-slate-900/95 p-3 md:p-4 rounded-xl border border-slate-600 shadow-2xl w-48 md:w-64 backdrop-blur-md z-[3000]"><div className="flex gap-2 mb-2"><button onClick={() => setIsPlaying(!isPlaying)} className="flex-1 bg-slate-700 py-2 rounded flex justify-center">{isPlaying ? <Pause size={16}/> : <Play size={16}/>}</button><button onClick={handleNextSong} className="flex-1 bg-slate-700 py-2 rounded flex justify-center"><SkipForward size={16}/></button></div><div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">{activeAssets.bgmPlaylist.map((_, idx) => (<button key={idx} onClick={() => handleSelectSong(idx)} className={`w-full text-left text-[10px] md:text-xs p-2 rounded truncate ${currentSongIndex === idx ? 'bg-green-600/30 text-green-400' : 'text-slate-400'}`}>🎵 เพลงที่ {idx + 1}</button>))}</div></div>)}</div>)}
          <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-900/80 p-2 md:p-3 rounded-full text-white hover:bg-slate-800 shadow-lg border border-slate-700"><Settings size={20} /></button>
          {showSettings && (<div className="bg-slate-900/90 p-4 rounded-xl border border-slate-600 shadow-2xl backdrop-blur-md text-white w-56 z-[3000]"><div className="mb-4 text-xs"><span>BGM</span><input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer" /></div><div className="text-xs"><span>SFX</span><input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={(e) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer" /></div></div>)}
      </div>

      {/* --- BOARD SECTION --- */}
      <div className="relative w-full h-[80%] md:w-[80%] md:h-full z-10 order-1 md:order-1 overflow-hidden flex items-center justify-center bg-slate-900">
          <div className="absolute inset-0 z-0">
              {activeAssets.bg ? (isVideoBg ? (<video src={activeAssets.bg} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<img src={activeAssets.bg} alt="Background" className="w-full h-full object-cover z-0" referrerPolicy="no-referrer" />)) : (<div className="w-full h-full" style={{ background: getGradientStyle() }} />)}
              <div className="absolute inset-0 bg-black/50 z-0"></div>
          </div>
          <button onClick={() => { localStorage.removeItem('math_game_session_players'); localStorage.removeItem('math_game_session_index'); onExit(); }} className="absolute top-4 left-4 z-50 bg-red-500/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><LogOut size={20} /></button>
          <div className="relative w-full h-full max-w-[100vh] max-h-[75vw] md:max-w-[calc(80vw-2rem)] md:max-h-[calc(100vh-2rem)] aspect-[4/3] shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-700/50 backdrop-blur-sm m-4">
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={pathD} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1, 3" /><path d={pathD} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {tiles.map((t, i) => {
                    const isSpecial = ['QUESTION', 'TREASURE', 'TRAP'].includes(t.type); 
                    const isStartFinish = ['START', 'FINISH'].includes(t.type); 
                    const sizeClass = isStartFinish ? 'w-[12%] md:w-[10%]' : isSpecial ? 'w-[10%] md:w-[8%]' : 'w-[8%] md:w-[6%]';
                    const tileStyle = getThemeColors(t.type); 
                    
                    return (
                        <div key={i} className={`absolute ${sizeClass} aspect-square -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-2xl border-[3px] md:border-4 shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-transform z-10 ${i === currentPlayer?.position ? 'scale-110 ring-4 ring-yellow-300 z-20' : 'scale-100'} ${tileStyle}`} style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                            <span className={`font-black ${isSpecial || isStartFinish ? 'text-sm md:text-xl' : 'hidden'}`}>
                                {t.type === 'START' && 'START'} 
                                {t.type === 'FINISH' && 'FINISH'} 
                                {t.type === 'QUESTION' && '?'} 
                                {t.type === 'TREASURE' && '💎'} 
                                {t.type === 'TRAP' && '🕸️'} 
                            </span>
                        </div>
                    );
                })}
                
                {localPlayers.map((p, i) => { 
                    const tile = tiles[Math.min(p.position, tiles.length-1)]; 
                    if (!tile) return null; 
                    return (
                        <div 
                            key={i} 
                            // [แก้ไข 2.1] ปรับขนาดตัวละครให้ใหญ่ขึ้น (มือถือ 12%, จอใหญ่ 8%)
                            className="absolute w-[9%] md:w-[8%] aspect-square -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500 ease-in-out" 
                            style={{ left: `${tile.x}%`, top: `${tile.y - 5}%` }}
                        >
                            <div className={`w-full h-full drop-shadow-2xl ${isMoving && localCurrentIndex === i ? 'animate-bounce' : ''}`}>
                                {/* [แก้ไข 2.2] ใส่กรอบสีรุ้ง (Gradient Border) */}
                                <div className="w-full h-full rounded-full p-[3px] md:p-[4px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-cyan-400 shadow-lg">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                        {p.profileImage ? (
                                            <img src={p.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Player" />
                                        ) : (
                                            <CharacterSvg 
                                                type={(p.appearance?.base === 'BOY' ? theme.player1Char : theme.player2Char) as CharacterType} 
                                                className="w-full h-full filter drop-shadow-lg scale-90" // scale-90 เพื่อไม่ให้รูปชิดขอบเกินไป
                                                appearance={p.appearance}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ); 
                })}
          </div>
      </div>

      <div className="relative w-full h-[20%] md:w-[20%] md:h-full z-20 order-2 md:order-2 bg-slate-900/95 border-t-4 md:border-t-0 md:border-l-4 border-slate-700 backdrop-blur-md flex flex-row md:flex-col items-center justify-between p-3 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <div className="flex flex-row md:flex-col items-center gap-3 w-[50%] md:w-full">
               <div className="relative w-14 h-14 md:w-32 md:h-32 hover:scale-110 transition-transform">
                   <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                   {currentPlayer?.profileImage ? (
                       <img src={currentPlayer.profileImage} className="w-full h-full rounded-full border-2 md:border-4 border-white shadow-2xl relative z-10 object-cover" referrerPolicy="no-referrer" alt="Current Player" />
                   ) : (
                       <CharacterSvg appearance={currentPlayer?.appearance} theme={currentThemeKey} className="w-full h-full drop-shadow-2xl relative z-10" />
                   )}
               </div>
               <div className="text-left md:text-center overflow-hidden min-w-0"><h1 className="text-sm md:text-2xl font-black text-white truncate">{currentPlayer?.nickname || currentPlayer?.firstName}</h1><div className="hidden md:block bg-slate-800/80 w-full p-3 rounded-xl border border-slate-600 mt-3"><div className="text-xs text-slate-400 uppercase">คะแนนสะสม</div><div className="text-5xl font-black text-yellow-400">{currentPlayer?.score}</div></div><div className="md:hidden text-yellow-400 font-black text-sm">⭐ {currentPlayer?.score} คะแนน</div></div>
           </div>
           
           <div className="w-[50%] md:w-full flex justify-end md:justify-center pl-2">
                <div className="bg-slate-800/40 p-3 rounded-2xl border-2 border-slate-600/50 shadow-xl backdrop-blur-sm flex flex-row md:flex-col items-center gap-4">
                    
                    <div className="bg-slate-900 w-16 h-12 md:w-full md:h-24 rounded-xl flex items-center justify-center border-2 border-slate-600 relative shadow-inner">
                        <span className={`text-3xl md:text-6xl font-black font-mono ${isSpinning ? 'text-white/50 blur-[1px]' : 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`}>
                            {displayNumber}
                        </span>
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAction(); }} 
                        disabled={isSpinning || isMoving || pendingSteps > 0 || isFinishingTurn || activeQuestion !== null || activeOverlay !== null}
                        className={`
                            relative group transition-all duration-100 ease-in-out
                            w-20 h-20 md:w-24 md:h-24 rounded-full 
                            flex items-center justify-center shrink-0
                            border-b-[6px] active:border-b-0 active:translate-y-[6px] active:shadow-none
                            shadow-xl hover:scale-105
                            ${(isSpinning || isMoving || pendingSteps > 0 || isFinishingTurn || activeQuestion !== null || activeOverlay !== null) 
                                ? 'bg-gradient-to-b from-red-500 to-red-600 border-red-800' 
                                : 'bg-gradient-to-b from-blue-400 to-blue-600 border-blue-800' 
                            }
                        `}
                    >
                        <div className="drop-shadow-md text-white">
                            {isSpinning ? (
                                <Dices className="animate-spin" size={32} /> 
                            ) : (isMoving || pendingSteps > 0 || isFinishingTurn || activeQuestion !== null || activeOverlay !== null) ? (
                                <Footprints className="animate-bounce" size={32} /> 
                            ) : (
                                <span className="font-black text-2xl">สุ่ม</span> 
                            )}
                        </div>
                        
                        {pendingSteps > 0 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 border-2 border-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center animate-bounce shadow-md z-10">
                                {pendingSteps}
                            </div>
                        )}
                    </button>
                </div>
           </div>
      </div>

      <MathModal question={activeQuestion} onAnswer={handleAnswer} volume={sfxVolume} calculatorUsesLeft={currentPlayer?.calculatorUsesLeft || 0} onConsumeCalculator={handleConsumeCalculator} />
      {activeOverlay && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-pop-in" onClick={() => !isMoving && activeOverlay.type !== 'WIN' && resumeMove()}><div className="bg-slate-800 p-8 rounded-3xl border-4 border-white text-center shadow-2xl max-w-sm"><div className="text-7xl mb-4 animate-bounce">{activeOverlay.type === 'TREASURE' ? '💎' : '🕸️'}</div><h2 className="text-2xl font-black text-white mb-2">{activeOverlay.msg}</h2></div></div>)}
      
      {gameFinished && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-pop-in">
             <div className="text-center p-6 bg-slate-800/90 rounded-2xl border-4 border-yellow-500 shadow-2xl backdrop-blur-md max-w-sm w-full mx-4 relative">
                <Trophy size={80} className="text-yellow-400 mx-auto mb-4 animate-bounce drop-shadow-lg" />
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-2">ยินดีด้วย!</h1>
                <p className="text-xl text-white mb-1 font-bold">{currentPlayer?.nickname || currentPlayer?.firstName}</p>
                <p className="text-slate-300 mb-4 text-sm">พิชิตเส้นชัยสำเร็จ</p>
                <div className="bg-black/40 p-4 rounded-xl border border-yellow-500/30 mb-6">
                    <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">คะแนนรวมรอบนี้</div>
                    <div className="text-5xl font-black text-yellow-400 drop-shadow-glow">{currentPlayer?.score}</div>
                </div>
                <button onClick={() => { localStorage.removeItem('math_game_session_players'); onGameEnd(); }} className="bg-green-600 w-full py-3 rounded-xl text-lg font-bold text-white shadow-lg transition flex items-center justify-center gap-2"><Home size={20} /> กลับหน้าหลัก</button>
             </div>
         </div>
      )}
    </div>
  );
};