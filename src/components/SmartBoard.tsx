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
  FALL: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'
};

const VIDEO_SOURCES = {
  IDLE: '/runner-vids/idle.mp4',
  RUN: '/runner-vids/run.mp4',
  SPRINT: '/runner-vids/sprint.mp4',
  FALL: '/runner-vids/fall.mp4',
  FINISHED: '/runner-vids/finish.mp4'
};

type RunnerState = keyof typeof VIDEO_SOURCES;

// --- Video Component (VideoLayer) ---
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

  // --- GAME LOGIC (Keep Original) ---

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
      setVisualEnergy(prev => Math.max(0, prev - 1));

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
      
      playSfx(SFX.CLICK);
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

  // --- REUSABLE UI COMPONENTS (ดีไซน์เดิม) ---
  
  const TopProfileSection = () => (
      <div className="w-full h-full bg-slate-800 border-b-4 border-slate-700 flex flex-col items-center justify-center p-2 relative">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-slate-700 shadow-lg overflow-hidden mb-2">
              {player.profileImage ? (
                  <img src={player.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                  <CharacterSvg type={player.appearance?.base === 'BOY' ? (theme.player1Char as import('../types').CharacterType) : (theme.player2Char as import('../types').CharacterType)} className="w-full h-full" appearance={player.appearance} />
              )}
          </div>
          <h2 className="text-xl font-bold text-white truncate max-w-full">{player.nickname || player.firstName}</h2>
          <div className="bg-slate-900/50 rounded-full px-4 py-1 mt-1 flex items-center gap-2 border border-slate-600">
              <Star size={14} className="text-yellow-400 fill-yellow-400"/>
              <span className="text-sm text-yellow-100 font-bold">{currentScore} คะแนน</span>
          </div>
          <div className="absolute top-2 right-2">
              <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-700 p-2 rounded-full text-white hover:bg-slate-600 transition"><Settings size={16} /></button>
          </div>
          {showSettings && (
              <div className="absolute top-10 right-2 bg-slate-900/95 p-4 rounded-xl border border-slate-600 w-40 text-white z-50 shadow-xl">
                  <div className="text-xs mb-2">BGM <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={e=>setBgmVolume(parseFloat(e.target.value))} className="w-full"/></div>
                  <div className="text-xs">SFX <input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={e=>setSfxVolume(parseFloat(e.target.value))} className="w-full"/></div>
              </div>
          )}
      </div>
  );

  const MiddleEnergySection = () => (
      <div className="w-full h-full bg-slate-800/80 flex flex-col items-center justify-center p-4 border-b-4 border-slate-700 relative overflow-hidden">
          <Zap size={80} className="absolute text-yellow-500/10 rotate-12 -right-4 -bottom-4"/>
          <div className="text-slate-300 font-bold uppercase mb-2 flex items-center gap-2 text-xs md:text-sm">
              <Zap className="text-yellow-400 fill-yellow-400"/> พลังงานคงเหลือ
          </div>
          <div className="text-4xl font-black text-white mb-2 drop-shadow-md">
              {visualEnergy} <span className="text-xl text-slate-400">/ 10</span>
          </div>
          <div className="w-full max-w-[80%] bg-slate-900 h-4 md:h-6 rounded-full overflow-hidden border-2 border-slate-600 shadow-inner">
              <div 
                  className={`h-full transition-all duration-500 ease-out ${visualEnergy > 5 ? 'bg-green-500' : visualEnergy > 2 ? 'bg-orange-500' : 'bg-red-500'}`}
                  style={{ width: `${energyPercent}%` }}
              ></div>
          </div>
      </div>
  );

  const BottomActionSection = () => (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-4 gap-4">
          <div className="text-center">
              <div className="text-xs text-indigo-400 uppercase font-bold tracking-wider flex items-center justify-center gap-2">
                  <Footprints size={14} /> ระยะทางรวม
              </div>
              <div className="text-3xl font-black text-white drop-shadow-glow">
                  {totalDistance} <span className="text-sm font-normal text-slate-400">เมตร</span>
              </div>
          </div>

          <button 
              onClick={handleDiceRoll}
              disabled={gameState !== 'ROLL' || isSpinning}
              className={`w-full py-4 rounded-xl text-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${gameState === 'ROLL' 
                      ? 'bg-green-500 hover:bg-green-400 border-b-4 border-green-700 text-white animate-bounce cursor-pointer' 
                      : 'bg-slate-700 border-b-4 border-slate-900 text-slate-500 cursor-not-allowed opacity-50 grayscale'
                  }`}
          >
              {isSpinning ? (
                  <Dices className="animate-spin mr-2"/>
              ) : gameState === 'ROLL' ? (
                  <>🎲 กดสุ่มระยะทาง!</>
              ) : (
                  <>🔒 รอปลดล็อค</>
              )}
              {isSpinning && <span>{displayNumber}...</span>}
          </button>
      </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden font-['Mali'] bg-black flex flex-col md:flex-row">
      
      {/* --- READY OVERLAY --- */}
      {!hasInteracted && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-pop-in">
            <div className="bg-slate-800 p-8 rounded-3xl border-4 border-yellow-400 text-center shadow-2xl max-w-sm md:max-w-lg mx-4">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-6">พร้อมผจญภัยหรือยัง?</h1>
                <p className="text-slate-300 mb-8 text-lg">ภารกิจ: บริหารพลังงานให้ครบ 10 ข้อ!</p>
                <button onClick={handleStartGame} className="bg-green-600 hover:bg-green-500 text-white text-xl md:text-2xl font-bold px-8 py-4 md:px-12 md:py-6 rounded-full shadow-lg flex items-center gap-3 mx-auto animate-bounce hover:scale-110 transition">
                    <PlayCircle size={32} /> เริ่มเกมเลย!
                </button>
            </div>
        </div>
      )}

      {/* ======================= MOBILE LAYOUT (20/55/25) ======================= */}
      <div className="md:hidden flex flex-col w-full h-full bg-slate-900">
          
          {/* Top 20% */}
          <div className="h-[20%] w-full relative z-30">
              <TopProfileSection />
              <button onClick={onExit} className="absolute top-2 left-2 bg-red-500/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><LogOut size={20} /></button>
          </div>

          {/* Middle 55% */}
          <div className="h-[55%] w-full relative z-10 bg-black">
              <VideoLayer stateKey="IDLE" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="RUN" activeState={runnerState} />
              <VideoLayer stateKey="SPRINT" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="FALL" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="FINISHED" activeState={runnerState} onVideoEnd={handleVideoFinish} />
          </div>

          {/* Bottom 25% (Energy & Action Side-by-Side for better fit) */}
          <div className="h-[25%] w-full bg-slate-900 border-t-4 border-slate-700 flex p-1 relative z-30">
              <div className="w-1/2 border-r border-slate-700"><MiddleEnergySection /></div>
              <div className="w-1/2"><BottomActionSection /></div>
          </div>
      </div>

      {/* ======================= DESKTOP LAYOUT (Original) ======================= */}
      <div className="hidden md:flex w-full h-full relative">
          
          {/* Video Area (75%) */}
          <div className="relative w-[75%] h-full bg-black overflow-hidden">
              <VideoLayer stateKey="IDLE" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="RUN" activeState={runnerState} />
              <VideoLayer stateKey="SPRINT" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="FALL" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <VideoLayer stateKey="FINISHED" activeState={runnerState} onVideoEnd={handleVideoFinish} />
              <button onClick={onExit} className="absolute top-4 left-4 z-50 bg-red-500/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><LogOut size={24} /></button>
          </div>

          {/* Sidebar (25%) */}
          <div className="w-[25%] h-full bg-slate-900 border-l-4 border-slate-700 flex flex-col shadow-2xl relative z-20">
              <div className="flex-[0.25]"><TopProfileSection /></div>
              <div className="flex-[0.4]"><MiddleEnergySection /></div>
              <div className="flex-[0.35]"><BottomActionSection /></div>
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
            compact={true} // Mobile = true
          />
      )}

      {/* สรุปผล */}
      {gameState === 'FINISHED' && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] animate-fade-in px-4">
             <div className="text-center p-8 bg-slate-800 rounded-3xl border-4 border-yellow-500 shadow-2xl max-w-sm w-full relative">
                <Trophy size={100} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                <h1 className="text-4xl font-black text-white mb-2">จบเกม!</h1>
                <div className="bg-black/50 p-6 rounded-2xl border border-yellow-500/30 mb-8 mt-4">
                    <div className="text-slate-400 text-xs uppercase mb-1">ระยะทางที่ทำได้</div>
                    <div className="text-6xl font-black text-green-400 drop-shadow-glow">{totalDistance} <span className="text-lg text-slate-500">ม.</span></div>
                </div>
                <div className="mb-6 text-yellow-400 font-bold text-xl">คะแนนรวม: {currentScore}</div>
                <button onClick={() => onGameEnd(totalDistance, currentScore)} className="bg-blue-600 w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg hover:scale-105 transition flex items-center justify-center gap-2">
                    <Home size={24} /> บันทึกและกลับ
                </button>
             </div>
         </div>
      )}

    </div>
  );
};