import React, { useState, useEffect, useRef } from 'react';
import type { PlayerState, MathQuestion, ThemeConfig, CharacterType } from '../types'; 
import { CharacterSvg } from './CharacterSvg';
import { MathModal } from './MathModal';
import { Trophy, LogOut, Settings, Home, Zap, PlayCircle, Star, Footprints, Dices } from 'lucide-react';
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
  CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  WRONG: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'
};

const VIDEOS = {
    IDLE: '/runner-vids/idle.mp4',
    RUN: '/runner-vids/run.mp4',
    SPRINT: '/runner-vids/sprint.mp4',
    FALL: '/runner-vids/fall.mp4',
    FINISH: '/runner-vids/finish.mp4'
};

export const SmartBoard: React.FC<Props> = ({ 
  player, theme, questions,
  onGameEnd, onExit 
}) => {
  // --- STATE ---
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentScore, setCurrentScore] = useState(player.score);
  
  // Video Control (เริ่มต้นเป็น null เพื่อให้ useEffect ทำงานเมื่อเริ่มเกม)
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  
  // Game Phase
  const [gameState, setGameState] = useState<'READY' | 'PLAYING_VIDEO' | 'QUIZ' | 'WAITING_TO_ROLL' | 'ROLLING' | 'FINISHED'>('READY');
  const [activeQuestion, setActiveQuestion] = useState<MathQuestion | null>(null);
  const [displayNumber, setDisplayNumber] = useState(0);
  
  // Settings
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const spinIntervalRef = useRef<any>(null);

  // --- HELPER ---
  const playSfx = (url: string) => { 
      const audio = new Audio(url); 
      audio.volume = sfxVolume; 
      audio.play().catch(()=>{}); 
  };

  // --- VIDEO LOGIC ---
  useEffect(() => {
      const videoEl = videoRef.current;
      if (videoEl && currentVideo) {
          videoEl.src = currentVideo;
          videoEl.load();
          
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
              playPromise.catch(e => console.log("Video Auto-play prevented:", e));
          }
      }
  }, [currentVideo]);

  // --- EVENT HANDLERS ---

  const handleStartGame = () => {
      setGameState('PLAYING_VIDEO');
      setCurrentVideo(VIDEOS.IDLE);
      setIsLooping(false); 
  };

  const handleVideoEnded = () => {
      if (currentVideo === VIDEOS.IDLE) {
          // IDLE จบ -> ต่อด้วย RUN (Loop) + แสดงโจทย์
          startRunPhase();
      } 
      else if (currentVideo === VIDEOS.SPRINT || currentVideo === VIDEOS.FALL) {
          // Action จบ -> เช็คว่าจบเกมหรือยัง
          if (currentQuestionIdx >= 10) {
              setCurrentVideo(VIDEOS.FINISH);
              setIsLooping(false);
          } else {
              startRunPhase();
          }
      }
      else if (currentVideo === VIDEOS.FINISH) {
          setGameState('FINISHED');
          playSfx(SFX.WIN);
          confetti();
      }
  };

  const startRunPhase = () => {
      setCurrentVideo(VIDEOS.RUN);
      setIsLooping(true); // วิ่งวนรอ
      
      // หน่วงเวลา 0.5s ให้ภาพวิ่งขึ้นก่อนค่อยโชว์โจทย์
      setTimeout(() => {
          showNextQuestion();
      }, 500); 
  };

  const showNextQuestion = () => {
      const q = questions[currentQuestionIdx] || {id:'err', question:'1+1', answer:2, options:[1,2,3,4]};
      setActiveQuestion(q);
      setGameState('QUIZ');
  };

  const handleAnswer = (correct: boolean) => {
      setActiveQuestion(null); 
      // ยังไม่เปลี่ยน Video ทันที (ให้เห็นภาพวิ่งวนไปก่อน)
      
      setCurrentQuestionIdx(prev => prev + 1);

      if (correct) {
          playSfx(SFX.CORRECT);
          setCurrentScore(prev => prev + 10);
          // ตอบถูก -> รอทอยเต๋า
          setGameState('WAITING_TO_ROLL');
      } else {
          playSfx(SFX.WRONG);
          // ตอบผิด -> ล้มทันที
          setGameState('PLAYING_VIDEO');
          setIsLooping(false);
          setCurrentVideo(VIDEOS.FALL);
      }
  };

  const handleManualRoll = () => {
      if (gameState !== 'WAITING_TO_ROLL') return;

      setGameState('ROLLING');
      playSfx(SFX.CLICK);
      
      let count = 0;
      spinIntervalRef.current = setInterval(() => {
          setDisplayNumber(Math.floor(Math.random() * 50) + 10);
          count++;
          if(count > 10) {
             clearInterval(spinIntervalRef.current);
             finishRoll();
          }
      }, 50);
  };

  const finishRoll = () => {
      const bonusDist = Math.floor(Math.random() * 6 + 3) * 10;
      setDisplayNumber(bonusDist);
      setTotalDistance(prev => prev + bonusDist);
      
      setGameState('PLAYING_VIDEO');
      setIsLooping(false);
      setCurrentVideo(VIDEOS.SPRINT);
  };

  const energyLeft = Math.max(0, 10 - currentQuestionIdx); 
  const energyPercent = (energyLeft / 10) * 100;

  // --- UI COMPONENTS ---

  const TopProfileSection = () => (
      <div className={`w-full h-full bg-slate-800 border-b-4 border-slate-700 flex flex-col items-center justify-center relative p-2`}>
          <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-white bg-slate-700 shadow-lg overflow-hidden relative">
                  {player.profileImage ? (
                      <img src={player.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      <CharacterSvg type={player.appearance?.base === 'BOY' ? (theme.player1Char as CharacterType) : (theme.player2Char as CharacterType)} className="w-full h-full" appearance={player.appearance} />
                  )}
              </div>
              <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-white truncate max-w-[150px]">{player.nickname || player.firstName}</h2>
                  <div className="bg-slate-900/50 rounded-full px-3 py-0.5 inline-flex items-center gap-1 border border-slate-700 w-fit">
                      <Star size={12} className="text-yellow-400 fill-yellow-400"/>
                      <span className="text-xs text-yellow-100 font-bold">{currentScore} คะแนน</span>
                  </div>
              </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="absolute top-2 right-2 bg-slate-700 p-2 rounded-full text-white hover:bg-slate-600 transition"><Settings size={16} /></button>
          {showSettings && (
              <div className="absolute top-10 right-2 bg-slate-900/95 p-4 rounded-xl border border-slate-600 w-40 text-white z-50 shadow-xl">
                  <div className="text-xs mb-2">BGM <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={e=>setBgmVolume(parseFloat(e.target.value))} className="w-full"/></div>
                  <div className="text-xs">SFX <input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={e=>setSfxVolume(parseFloat(e.target.value))} className="w-full"/></div>
              </div>
          )}
      </div>
  );

  const MiddleEnergySection = () => (
      <div className="w-full h-full bg-slate-800 border-b-4 border-slate-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <Zap size={80} className="absolute text-yellow-500/5 rotate-12 -right-4 -bottom-4"/>
          <div className="text-slate-300 text-sm uppercase font-bold mb-2 flex items-center gap-2">
              <Zap className="text-yellow-400 fill-yellow-400"/> พลังงานคงเหลือ
          </div>
          <div className="text-4xl font-black text-white mb-2 drop-shadow-md">
              {energyLeft} <span className="text-lg text-slate-500">/ 10</span>
          </div>
          <div className="w-[80%] bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-700 shadow-inner">
              <div 
                className={`h-full transition-all duration-500 ease-out ${energyLeft > 5 ? 'bg-green-500' : energyLeft > 2 ? 'bg-orange-500' : 'bg-red-500'}`} 
                style={{ width: `${energyPercent}%` }}>
              </div>
          </div>
      </div>
  );

  const BottomActionSection = () => (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-4 gap-3 relative">
          <div className="text-center w-full">
               <span className="text-[10px] text-indigo-300 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Footprints size={12}/> ระยะทางรวม</span>
               <div className="text-3xl font-black text-white leading-none">{totalDistance} <span className="text-xs text-indigo-400 font-normal">เมตร</span></div>
          </div>

          <div className="w-full h-14">
               <button 
                  onClick={handleManualRoll}
                  disabled={gameState !== 'WAITING_TO_ROLL'}
                  className={`w-full h-full rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
                      ${gameState === 'WAITING_TO_ROLL' 
                          ? 'bg-green-600 hover:bg-green-500 border-b-4 border-green-800 text-white animate-bounce cursor-pointer' 
                          : gameState === 'ROLLING'
                            ? 'bg-yellow-500 border-b-4 border-yellow-700 text-white'
                            : 'bg-slate-700 border-b-4 border-slate-800 text-slate-500 cursor-not-allowed opacity-50 grayscale'}`}
               >
                   {gameState === 'ROLLING' ? (
                       <span className="text-xl font-black">{displayNumber}</span>
                   ) : gameState === 'WAITING_TO_ROLL' ? (
                       <>
                         <Dices size={24}/> <span className="font-bold">กดสุ่มระยะทาง!</span>
                       </>
                   ) : (
                       <><span className="text-sm">🔒 ตอบถูกเพื่อปลดล็อค</span></>
                   )}
               </button>
          </div>
      </div>
  );

  // ส่วนแสดงวิดีโอ
  const VideoDisplay = () => (
      <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden shadow-inner z-10">
          <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
              loop={isLooping}
              muted={false}
              playsInline
              onContextMenu={(e) => e.preventDefault()}
          />
          {!currentVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-0">
                  <span className="text-slate-500">Video Loading...</span>
              </div>
          )}
      </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden font-['Mali'] bg-black flex flex-col md:flex-row">
      
      {/* Exit Button */}
      <button onClick={onExit} className="fixed top-4 left-4 z-[60] bg-red-500/20 p-2 rounded-full text-white hover:bg-red-500 transition-colors"><LogOut size={24} /></button>

      {/* --- MOBILE LAYOUT (25-50-25) --- */}
      <div className="md:hidden w-full h-full flex flex-col">
          <div className="h-[25%]"><TopProfileSection /></div>
          <div className="h-[50%] relative"><VideoDisplay /></div>
          <div className="h-[25%]"><BottomActionSection /></div>
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex w-full h-full">
          <div className="w-[70%] h-full relative"><VideoDisplay /></div>
          
          {/* Right: Dashboard (30%) */}
          <div className="w-[30%] h-full bg-slate-900 border-l-4 border-slate-700 flex flex-col">
              <div className="flex-[0.3]"><TopProfileSection /></div>
              <div className="flex-[0.4]"><MiddleEnergySection /></div>
              <div className="flex-[0.3]"><BottomActionSection /></div>
          </div>
      </div>

      {/* --- READY OVERLAY --- */}
      {gameState === 'READY' && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center backdrop-blur-md animate-pop-in px-4">
            <div className="bg-slate-800 p-8 rounded-3xl border-4 border-yellow-400 text-center shadow-2xl w-full max-w-md">
                <h1 className="text-4xl font-black text-white mb-4">พร้อมลุยไหม?</h1>
                <p className="text-slate-300 mb-8 text-lg">ภารกิจ: ตอบ 10 ข้อ<br/>เพื่อวิ่งให้ไกลที่สุด!</p>
                <button 
                    onClick={handleStartGame} 
                    className="bg-green-600 hover:bg-green-500 text-white text-2xl font-bold px-12 py-5 rounded-full shadow-lg flex items-center gap-3 mx-auto animate-bounce hover:scale-105 transition active:scale-95"
                >
                    <PlayCircle size={32} /> เริ่มเกมเลย!
                </button>
            </div>
        </div>
      )}

      {/* --- QUIZ MODAL --- */}
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

      {/* --- FINISH OVERLAY --- */}
      {gameState === 'FINISHED' && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[2000] animate-pop-in px-4">
             <div className="text-center p-8 bg-slate-800 rounded-3xl border-4 border-yellow-500 shadow-2xl max-w-md w-full relative">
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