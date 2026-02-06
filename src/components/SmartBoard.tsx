import React, { useState, useEffect, useRef } from 'react';
import type { PlayerState, MathQuestion, ThemeConfig } from '../types'; 
import { CharacterSvg } from './CharacterSvg';
import { MathModal } from './MathModal';
import { Trophy, LogOut, Settings, Home, Dices, Footprints, Zap, PlayCircle, Star } from 'lucide-react';
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
  SPRINT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  FALL: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'
};

const VIDEO_SOURCES = {
  IDLE: '/runner-vids/idle.mp4',
  RUN: '/runner-vids/run.mp4',
  SPRINT: '/runner-vids/sprint.mp4',
  FALL: '/runner-vids/fall.mp4',
  FINISHED: '/runner-vids/finish.mp4'
};

type RunnerState = keyof typeof VIDEO_SOURCES;

// --- Video Component ---
const VideoLayer = ({ 
    stateKey, 
    activeState, 
    onVideoEnd 
}: { 
    stateKey: RunnerState, 
    activeState: RunnerState, 
    onVideoEnd?: () => void 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isActive = activeState === stateKey;
    const shouldLoop = stateKey === 'RUN'; 

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause(); 
            }
        }
    }, [isActive]);

    return (
        <video
            ref={videoRef}
            src={VIDEO_SOURCES[stateKey]}
            loop={shouldLoop}
            muted
            playsInline
            onEnded={() => {
                if (isActive && !shouldLoop && onVideoEnd) {
                    onVideoEnd();
                }
            }}
            // [Fix Mobile] ใช้ object-contain เพื่อให้วิดีโอไม่โดนตัดขอบ และถมพื้นหลังสีดำ
            className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
    );
};

export const SmartBoard: React.FC<Props> = ({ 
  player, theme, questions,
  onGameEnd, onExit 
}) => {
  
  // --- STATE ---
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentScore, setCurrentScore] = useState(player.score);
  
  const [visualEnergy, setVisualEnergy] = useState(10); 
  const [showEnergyDeduced, setShowEnergyDeduced] = useState(false);

  const [runnerState, setRunnerState] = useState<RunnerState>('IDLE');
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'QUIZ' | 'ROLL' | 'MOVING' | 'FINISHED'>('READY');
  
  const [displayNumber, setDisplayNumber] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinIntervalRef = useRef<any>(null);
  const distanceIntervalRef = useRef<any>(null);

  const [activeQuestion, setActiveQuestion] = useState<MathQuestion | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // --- GAME LOGIC ---

  const handleStartGame = () => {
      setHasInteracted(true);
      setGameState('PLAYING');
      setRunnerState('IDLE'); 
      setVisualEnergy(10); 
  };

  const prepareNextQuestion = () => {
      if (currentQuestionIdx >= 10) {
          return;
      }
      setGameState('QUIZ');
      setRunnerState('RUN'); 
      const q = questions[currentQuestionIdx] || {id:'err', question:'1+1', answer:2, options:[1,2,3,4]};
      setActiveQuestion(q);
  };

  const handleAnswer = (correct: boolean) => {
      setActiveQuestion(null);
      
      // ลดพลังงานและแสดง Effect -1 ทันที
      setVisualEnergy(prev => Math.max(0, prev - 1));
      setShowEnergyDeduced(true);
      setTimeout(() => setShowEnergyDeduced(false), 2000); 

      if (correct) {
          playSfx(SFX.SPRINT); 
          setCurrentScore(prev => prev + 10);
          setGameState('ROLL'); 
          setRunnerState('RUN'); 
      } else {
          playSfx(SFX.FALL);
          setRunnerState('FALL'); 
          setGameState('MOVING'); 
      }
  };

  const handleVideoFinish = () => {
      const isLastQuestion = currentQuestionIdx >= 9;

      if (runnerState === 'IDLE') {
          prepareNextQuestion();
          setRunnerState('RUN'); 
      }
      else if (runnerState === 'SPRINT') {
          if (distanceIntervalRef.current) clearInterval(distanceIntervalRef.current);
          
          if (isLastQuestion) {
              setRunnerState('FINISHED');
          } else {
              setRunnerState('RUN'); 
              setTimeout(prepareNextQuestion, 500); 
          }
      } 
      else if (runnerState === 'FALL') {
          if (isLastQuestion) {
              setRunnerState('FINISHED');
          } else {
              setRunnerState('RUN'); 
              setCurrentQuestionIdx(prev => prev + 1); 
              setTimeout(prepareNextQuestion, 500);
          }
      }
      else if (runnerState === 'FINISHED') {
          finishGame();
      }
  };

  const handleDiceRoll = () => {
      if (gameState !== 'ROLL') return;
      
      setIsSpinning(true);
      spinIntervalRef.current = setInterval(() => {
          setDisplayNumber(Math.floor(Math.random() * 6) + 1);
      }, 50);

      setTimeout(() => {
          if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
          
          const finalDice = Math.floor(Math.random() * 6) + 1; 
          setDisplayNumber(finalDice);
          setIsSpinning(false);
          
          startSprint(finalDice);
      }, 1500);
  };

  const startSprint = (diceValue: number) => {
      setGameState('MOVING');
      setRunnerState('SPRINT'); 
      playSfx(SFX.SPRINT);

      const distanceToAdd = diceValue * 10; 
      const targetDistance = totalDistance + distanceToAdd;

      animateDistanceVisual(targetDistance);
      
      if (currentQuestionIdx < 9) {
          setCurrentQuestionIdx(prev => prev + 1);
      }
  };

  const animateDistanceVisual = (target: number) => {
      if (distanceIntervalRef.current) clearInterval(distanceIntervalRef.current);
      
      const startTime = Date.now();
      const startDist = totalDistance;
      const duration = 2000; 

      distanceIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const current = Math.floor(startDist + ((target - startDist) * progress));
          setTotalDistance(current);
          if (progress >= 1) clearInterval(distanceIntervalRef.current);
      }, 50);
  };

  const finishGame = () => {
      setGameState('FINISHED');
      setRunnerState('FINISHED');
      playSfx(SFX.WIN);
      confetti();
  };

  const playSfx = (url: string) => { 
      const audio = new Audio(url); 
      audio.volume = sfxVolume; 
      audio.play().catch(()=>{}); 
  };

  const energyPercent = (visualEnergy / 10) * 100;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col md:flex-row font-['Mali'] bg-black">
      
      <style>{`
        @keyframes pop-flash {
            0% { transform: scale(1); opacity: 1; color: #ef4444; }
            50% { transform: scale(1.5); opacity: 1; color: #ff0000; }
            100% { transform: scale(1); opacity: 0; }
        }
        .animate-pop-flash { animation: pop-flash 1.5s forwards ease-out; }
      `}</style>

      {/* 1. READY OVERLAY */}
      {!hasInteracted && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-pop-in">
            <div className="bg-slate-800 p-8 rounded-3xl border-4 border-yellow-400 text-center shadow-2xl max-w-sm md:max-w-lg mx-4">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-6">พร้อมผจญภัยหรือยัง?</h1>
                <p className="text-slate-300 mb-8 text-lg">ภารกิจ: บริหารพลังงานให้ครบ 10 ข้อ!</p>
                <button onClick={handleStartGame} className="bg-green-600 hover:bg-green-500 text-white text-xl md:text-2xl font-bold px-8 py-4 md:px-12 md:py-6 rounded-full shadow-lg flex items-center gap-3 mx-auto animate-bounce hover:scale-110 transition">
                    <PlayCircle size={32} /> เริ่มเกมเลย!
                </button>
                <p className="text-slate-400 mt-6 text-xs md:text-sm">(แตะเพื่อเปิดเสียง)</p>
            </div>
        </div>
      )}

      {/* Settings */}
      <div className="absolute top-2 right-2 z-50">
          <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-900/80 p-2 rounded-full text-white border border-slate-700 hover:bg-slate-700 transition"><Settings size={24} /></button>
          {showSettings && (
              <div className="absolute right-0 mt-2 bg-slate-900/90 p-4 rounded-xl border border-slate-600 w-48 text-white z-50">
                  <div className="text-xs mb-2">BGM <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={e=>setBgmVolume(parseFloat(e.target.value))} className="w-full"/></div>
                  <div className="text-xs">SFX <input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={e=>setSfxVolume(parseFloat(e.target.value))} className="w-full"/></div>
              </div>
          )}
      </div>

      {/* --- LEFT: RUNNER SCENE --- */}
      {/* [Fix Mobile] ใช้ flex-1 เพื่อยืดเต็มพื้นที่ที่เหลือ แทนการฟิกความสูง */}
      <div className="relative w-full flex-1 md:w-[75%] md:h-full z-10 bg-black overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-slate-700 shadow-2xl">
          <div className="absolute inset-0 z-0 bg-slate-900">
              <VideoLayer stateKey="IDLE" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="RUN" activeState={runnerState} />
              <VideoLayer stateKey="SPRINT" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="FALL" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="FINISHED" activeState={runnerState} onVideoEnd={handleVideoFinish} />
          </div>
          <button onClick={onExit} className="absolute top-4 left-4 z-50 bg-red-500/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><LogOut size={24} /></button>
      </div>

      {/* --- RIGHT: DASHBOARD --- */}
      {/* [Fix Mobile] ใช้ h-auto และ p-2 เพื่อลดขนาดความสูงให้พอดีเนื้อหา ไม่กินที่ */}
      <div className="relative w-full h-auto min-h-[20%] md:w-[25%] md:h-full z-20 bg-slate-900/95 backdrop-blur-md flex flex-row md:flex-col p-2 md:p-6 gap-2 md:gap-4 justify-between items-stretch shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
           
           {/* SECTION 1: PLAYER INFO */}
           <div className="flex-[0.7] bg-slate-800/80 rounded-2xl border-2 border-slate-600 p-2 md:p-3 shadow-lg flex flex-col items-center justify-center relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white bg-slate-700 shadow-xl overflow-hidden mb-1 relative">
                    {player.profileImage ? (
                        <img src={player.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <CharacterSvg type={player.appearance?.base === 'BOY' ? (theme.player1Char as import('../types').CharacterType) : (theme.player2Char as import('../types').CharacterType)} className="w-full h-full" appearance={player.appearance} />
                    )}
                </div>
                <div className="text-center w-full">
                    <h2 className="text-xs md:text-sm font-bold text-white truncate px-1">{player.nickname || player.firstName}</h2>
                    <div className="bg-slate-900/50 rounded-full px-2 py-0.5 mt-1 inline-flex items-center gap-1 border border-slate-700">
                        <Star size={10} className="text-yellow-400 fill-yellow-400"/>
                        <span className="text-[10px] md:text-xs text-yellow-100 font-bold">{currentScore} คะแนน</span>
                    </div>
                </div>
           </div>

           {/* SECTION 2: ENERGY BAR */}
           <div className="flex-1 bg-slate-800/80 rounded-2xl border border-slate-600/50 p-3 shadow-lg flex flex-col justify-center relative overflow-visible">
               
               <div className="flex justify-between items-center mb-2 relative z-10">
                   <div className="flex items-center gap-1 text-slate-300 text-[10px] md:text-xs uppercase font-bold">
                       <Zap size={14} className="text-yellow-400 fill-yellow-400"/> พลังงานคงเหลือ
                       {showEnergyDeduced && (
                           <span className="ml-2 text-red-500 font-black text-sm md:text-lg animate-pop-flash shadow-red-500/50 drop-shadow-md">-1</span>
                       )}
                   </div>
                   <div className="text-[10px] text-slate-400 font-mono">{visualEnergy} / 10</div>
               </div>
               
               <div className="w-full bg-slate-900 h-3 md:h-4 rounded-full overflow-hidden border border-slate-700 shadow-inner relative z-10">
                   <div 
                        className={`h-full transition-all duration-500 ease-out relative ${visualEnergy <= 3 ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}
                        style={{ width: `${energyPercent}%` }}
                   >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                   </div>
               </div>
               <div className="text-right text-[9px] md:text-[10px] text-slate-500 mt-1">ใช้ไปแล้ว {10 - visualEnergy} ครั้ง</div>
           </div>

           {/* SECTION 3: DICE / DISTANCE */}
           <div className="flex-[0.8] bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl border-2 border-indigo-500/30 p-2 md:p-3 shadow-xl flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 relative overflow-visible">
               <div className="text-center z-10 flex flex-col justify-center w-full">
                   <div className="flex items-center justify-center gap-1 text-indigo-300 text-[10px] md:text-xs font-bold uppercase mb-0.5">
                       <Footprints size={12}/> ระยะทาง
                   </div>
                   <div className="text-3xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(129,140,248,0.5)] leading-none">
                       {totalDistance}
                   </div>
                   <div className="text-[9px] text-indigo-400">เมตร</div>
               </div>

               <div className="z-20 relative">
                   <button 
                       onClick={handleDiceRoll}
                       disabled={gameState !== 'ROLL' || isSpinning}
                       className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-b-[5px] shadow-xl flex flex-col items-center justify-center transition-all ${
                           gameState === 'ROLL' 
                           ? 'bg-gradient-to-b from-green-400 to-green-600 border-green-800 animate-bounce active:translate-y-1 active:border-b-0 cursor-pointer scale-110' 
                           : 'bg-slate-700 border-slate-900 opacity-50 cursor-not-allowed grayscale'
                       }`}
                   >
                       {isSpinning ? (
                           <Dices className="animate-spin text-white w-8 h-8"/>
                       ) : (
                           <span className={`text-3xl md:text-4xl font-black ${gameState === 'ROLL' ? 'text-white' : 'text-slate-500'}`}>
                               {gameState === 'ROLL' ? 'กด!' : displayNumber}
                           </span>
                       )}
                       {gameState !== 'ROLL' && !isSpinning && <span className="text-[8px] text-slate-400 absolute bottom-2">รอตอบ</span>}
                   </button>
               </div>
           </div>

      </div>

      {/* --- Modals --- */}
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

      {/* สรุปผล */}
      {gameState === 'FINISHED' && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] animate-fade-in">
             <div className="text-center p-8 bg-slate-900/90 rounded-3xl border-4 border-yellow-500 shadow-2xl backdrop-blur-md max-w-sm w-full relative transform scale-110">
                <Trophy size={100} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                <h1 className="text-4xl font-black text-white mb-2">จบเกม!</h1>
                <p className="text-slate-400 mb-6">ระยะทางรวมทั้งหมด</p>
                <div className="bg-black/50 p-6 rounded-2xl border border-yellow-500/30 mb-8">
                    <div className="text-6xl font-black text-green-400 drop-shadow-glow">{totalDistance}</div>
                    <div className="text-sm text-slate-500 mt-2">เมตร</div>
                </div>
                <div className="mb-6 text-yellow-400 font-bold text-xl">คะแนนรวม: {currentScore}</div>
                <button onClick={() => onGameEnd(totalDistance, currentScore)} className="bg-blue-600 w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg hover:scale-105 transition flex items-center justify-center gap-2">
                    <Home size={24} /> บันทึกและกลับหน้าหลัก
                </button>
             </div>
         </div>
      )}

    </div>
  );
};