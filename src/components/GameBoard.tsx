import React, { useState, useEffect } from 'react';
import type { PlayerState, ThemeConfig, MathQuestion, QuestionDetail, ScoringMode } from '../types';
import { Star, Trophy, Home, HelpCircle } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';
import { CharacterSvg } from './CharacterSvg';
import { MathModal } from './MathModal';

interface Props {
  players: PlayerState[];
  currentPlayerIndex: number;
  theme: ThemeConfig;
  gameMode: ScoringMode;
  questions: MathQuestion[];
  onTurnComplete: (players: PlayerState[]) => void;
  onQuestionAnswered: (detail: QuestionDetail) => void;
  onGameEnd: () => void;
  onExit: () => void;
}

export const GameBoard: React.FC<Props> = ({ 
  players, 
  currentPlayerIndex, 
  theme, 
  gameMode, 
  questions,
  onTurnComplete, 
  onQuestionAnswered, 
  onGameEnd, 
  onExit 
}) => {
  const [localPlayers, setLocalPlayers] = useState<PlayerState[]>(players);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  
  // [แก้ไข] ลบ successAudio ออก เพราะไม่ได้ใช้
  
  // เอฟเฟกต์พลุกระดาษเมื่อจบเกม
  useEffect(() => {
    const winner = localPlayers.find(p => p.score >= 20);
    if (winner) {
      canvasConfetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(onGameEnd, 3000);
    }
  }, [localPlayers, onGameEnd]);

  const handleDiceRoll = () => {
    if (questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        setCurrentQuestion(questions[randomIndex]);
        setShowQuestion(true);
    } else {
        alert("ไม่พบโจทย์ในระบบ");
    }
  };

  const handleAnswerSubmit = (isCorrect: boolean, timeUsed: number, userAnswer: string) => {
    setShowQuestion(false);
    
    if (currentQuestion) {
        const detail: QuestionDetail = {
            questionId: currentQuestion.id,
            questionText: currentQuestion.question,
            userAnswer: userAnswer,
            correctAnswer: currentQuestion.answer.toString(),
            isCorrect: isCorrect,
            timeSpent: timeUsed,
            timestamp: new Date().toISOString()
        };
        onQuestionAnswered(detail);

        if (isCorrect) {
            const newPlayers = [...localPlayers];
            newPlayers[currentPlayerIndex].score += 1;
            newPlayers[currentPlayerIndex].position += 1;
            setLocalPlayers(newPlayers);
            onTurnComplete(newPlayers);
            
            canvasConfetti({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.7 }
            });
        } else {
            onTurnComplete(localPlayers);
        }
    }
  };

  return (
    <div className={`relative w-full h-full bg-slate-900 overflow-hidden flex flex-col ${theme.bgClass}`}>
      {/* Header */}
      <div className="bg-slate-800/90 p-4 flex justify-between items-center z-10 border-b-2 border-slate-700 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
            <Home size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white leading-none">{theme.name}</h2>
            <span className="text-xs text-slate-400">โหมด: {gameMode === 'CLASSROOM' ? 'เก็บคะแนน' : 'เล่นทั่วไป'}</span>
          </div>
        </div>
        
        {/* Score Board */}
        <div className="flex gap-4">
            {localPlayers.map((p, idx) => (
                <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${idx === currentPlayerIndex ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-700 border-slate-600 opacity-80'}`}>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-white">
                        <CharacterSvg appearance={p.appearance} type={p.character === 'BOY' ? undefined : 'ASTRONAUT'} /> 
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">{p.nickname}</span>
                        <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={12} fill="currentColor"/>
                            <span className="font-black text-sm">{p.score}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Game Area (Board) */}
      <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl relative min-h-[300px] bg-white/5 rounded-3xl border-4 border-white/10 p-10 flex flex-wrap gap-4 justify-center content-center backdrop-blur-sm">
            {[...Array(20)].map((_, index) => (
                <div key={index} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-slate-500 font-bold text-xl border-4 ${index < localPlayers[0].position ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700'}`}>
                    {index + 1}
                    {localPlayers.map((p, pIdx) => p.position === index && (
                        <div key={pIdx} className="absolute w-12 h-12 md:w-16 md:h-16 -mt-8 animate-bounce" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}>
                            <CharacterSvg appearance={p.appearance} />
                        </div>
                    ))}
                </div>
            ))}
            
            {/* Goal */}
            <div className="w-20 h-20 bg-yellow-400/20 border-4 border-yellow-400 rounded-full flex items-center justify-center ml-4 animate-pulse">
                <Trophy className="text-yellow-400" size={32} />
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-slate-800/90 border-t-2 border-slate-700 flex justify-center z-10 pb-10 md:pb-6">
         <button 
            onClick={handleDiceRoll}
            className="group relative px-8 py-4 bg-gradient-to-b from-orange-400 to-red-500 text-white font-black text-2xl rounded-2xl shadow-[0_6px_0_#9a3412] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-3"
         >
            <HelpCircle size={32} className="group-hover:rotate-12 transition-transform"/>
            <span>ลุยข้อต่อไป!</span>
         </button>
      </div>

      {/* Modal */}
      {showQuestion && currentQuestion && (
        <MathModal 
            question={currentQuestion} 
            onAnswer={handleAnswerSubmit} 
            onClose={() => setShowQuestion(false)} 
        />
      )}
    </div>
  );
};