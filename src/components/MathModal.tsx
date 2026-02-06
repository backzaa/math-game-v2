import React, { useState } from 'react';
import type { MathQuestion } from '../types';
import { Calculator, CheckCircle2, XCircle, Delete } from 'lucide-react';

interface Props {
  question: MathQuestion | null;
  onAnswer: (correct: boolean, usedCalculator: boolean) => void;
  volume: number;
  calculatorUsesLeft: number;
  onConsumeCalculator: () => void;
  compact?: boolean;
}

const SFX = {
  CORRECT: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
  WRONG: new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3')
};

export const MathModal: React.FC<Props> = ({ question, onAnswer, volume, calculatorUsesLeft, onConsumeCalculator, compact = false }) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; show: boolean }>({ isCorrect: false, show: false });
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [usedCalcInThisQuestion, setUsedCalcInThisQuestion] = useState(false);

  const playSound = (isCorrect: boolean) => {
      const sound = isCorrect ? SFX.CORRECT : SFX.WRONG;
      sound.currentTime = 0;
      sound.volume = volume;
      sound.play().catch(e => console.log("Audio play failed", e));
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH'; 
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        utterance.rate = isMobile ? 1.0 : 0.8;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
  };

  if (!question) return null;

  const handleAnswerClick = (isCorrect: boolean) => {
    if (feedback.show) return;
    
    playSound(isCorrect);
    setFeedback({ isCorrect, show: true });
    if (isCorrect) speak("เก่งมาก ถูกต้องครับ");
    else speak(`ผิดนิดนึง คำตอบคือ ${question.answer} ครับ`); 
    
    setTimeout(() => {
      onAnswer(isCorrect, usedCalcInThisQuestion);
      setFeedback({ isCorrect: false, show: false });
      setShowCalculator(false);
      setUsedCalcInThisQuestion(false);
      setCalcDisplay('0');
    }, 2000);
  };

  const activateCalculator = () => {
      if (calculatorUsesLeft > 0 && !feedback.show) {
          setShowCalculator(true);
      }
  };

  const handleCalcInput = (val: string) => {
      if(val === 'C') setCalcDisplay('0');
      else if(val === 'DEL') setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      else if(val === '=') {
          if (!usedCalcInThisQuestion) {
              onConsumeCalculator();
              setUsedCalcInThisQuestion(true);
          }
          try { 
              const expression = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/');
              // eslint-disable-next-line no-eval
              const result = eval(expression);
              setCalcDisplay(Number.isInteger(result) ? result.toString() : result.toFixed(2)); 
          } catch(e) { setCalcDisplay('Error'); }
      } else {
          setCalcDisplay(prev => prev === '0' ? val : prev + val);
      }
  };

  const overlayClass = compact 
    ? "fixed inset-0 z-[1000] flex items-end justify-center pb-6 pointer-events-none" 
    : "fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-pop-in";
  
  const containerClass = compact
    ? "bg-slate-900/90 rounded-t-3xl rounded-b-xl border-2 border-yellow-400/50 w-[95%] max-w-sm px-4 py-6 relative shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md pointer-events-auto animate-slide-up mx-auto mb-2"
    : "bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border-4 border-slate-600 max-w-2xl w-full p-8 relative shadow-2xl";
  
  const questionTextClass = compact
    ? "text-3xl font-mono text-white font-bold tracking-wider"
    : "text-5xl md:text-6xl font-mono text-white font-bold tracking-wider";
  
  const optionBtnClass = compact
    ? "bg-white/90 hover:bg-white text-slate-900 text-xl font-bold py-4 rounded-xl shadow border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all"
    : "bg-white hover:bg-blue-50 active:scale-95 text-slate-900 text-4xl md:text-5xl font-bold py-6 rounded-2xl shadow-[0_6px_0_#cbd5e1] border-2 border-slate-300 transition-all hover:-translate-y-1";

  return (
    <div className={overlayClass}>
      
      {feedback.show && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
           <div className={`p-8 rounded-3xl text-center border-4 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pop-in ${feedback.isCorrect ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'}`}>
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 size={80} className="text-white animate-bounce" />
                  <div><h2 className="text-4xl font-black text-white drop-shadow-lg mb-2">ถูกต้อง!</h2></div>
                  {usedCalcInThisQuestion && <div className="text-yellow-300 font-bold bg-black/30 px-4 py-1 rounded-full text-sm">+5 คะแนน (ตัวช่วย)</div>}
                  {!usedCalcInThisQuestion && <div className="text-white font-bold bg-black/30 px-4 py-1 rounded-full text-sm">+10 คะแนน</div>}
                </>
              ) : (
                <>
                  <XCircle size={80} className="text-white animate-pulse" />
                  <div><h2 className="text-4xl font-black text-white drop-shadow-lg mb-2">ผิดนิดนึง</h2></div>
                  <div className="bg-white/20 px-6 py-2 rounded-xl backdrop-blur-sm mt-2 mb-4 border-2 border-white/30">
                      <p className="text-sm text-slate-200">คำตอบที่ถูกคือ</p>
                      <p className="text-4xl font-black text-yellow-300 drop-shadow-md">{question.answer}</p>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

       <div className={containerClass}>
          <div className="mb-4 text-center">
            {!compact && <h2 className="text-2xl text-slate-400 font-bold mb-4">คำถามคณิตศาสตร์</h2>}
            <div className={`rounded-2xl border border-slate-500/50 ${compact ? 'bg-black/40 p-4' : 'bg-black/40 p-6'}`}>
                 <span className={questionTextClass}>{question.question} = ?</span>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-3 ${compact ? 'mb-2' : 'mb-8'}`}>
            {question.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswerClick(opt === question.answer)} className={optionBtnClass}>
                {opt}
              </button>
            ))}
          </div>
          
          <div className={`flex justify-center ${compact ? 'absolute -top-12 right-0' : 'border-t border-slate-700 pt-6'}`}>
              <button 
                disabled={calculatorUsesLeft <= 0 && !usedCalcInThisQuestion} 
                onClick={activateCalculator} 
                className={`group ${compact ? 'scale-90 hover:scale-100 transition' : 'flex flex-col items-center gap-2 hover:scale-105 transition'} ${calculatorUsesLeft <= 0 && !usedCalcInThisQuestion ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
              >
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-orange-500/50 border-4 border-orange-400 relative">
                      <Calculator color="white" size={32}/>
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                          {calculatorUsesLeft}
                      </div>
                  </div>
                  {!compact && <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-orange-400">เครื่องคิดเลข</span>
                      <span className="text-[10px] text-slate-500">เหลือ {calculatorUsesLeft} ครั้ง</span>
                  </div>}
              </button>
          </div>
        
          {showCalculator && (
              <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
                  <div className="w-[260px] bg-slate-800 rounded-[25px] p-3 flex flex-col border-4 border-orange-400 shadow-2xl animate-pop-in">
                      <div className="bg-[#d4e0b3] p-2 rounded-xl mb-3 border-4 border-slate-600 shadow-inner h-16 flex items-end justify-end overflow-hidden">
                         <div className="text-slate-800 font-mono text-3xl font-black tracking-widest">{calcDisplay}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                          <button onClick={()=>handleCalcInput('C')} className="aspect-square bg-red-400 hover:bg-red-300 text-white font-black rounded-xl shadow-[0_3px_0_#991b1b] active:translate-y-[2px] active:shadow-none text-lg">C</button>
                          <button onClick={()=>handleCalcInput('÷')} className="aspect-square bg-orange-400 hover:bg-orange-300 text-white font-black rounded-xl shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none text-xl">÷</button>
                          <button onClick={()=>handleCalcInput('×')} className="aspect-square bg-orange-400 hover:bg-orange-300 text-white font-black rounded-xl shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none text-xl">×</button>
                          <button onClick={()=>handleCalcInput('DEL')} className="aspect-square bg-red-400 hover:bg-red-300 text-white flex items-center justify-center rounded-xl shadow-[0_3px_0_#991b1b] active:translate-y-[2px] active:shadow-none"><Delete size={18} strokeWidth={3} /></button>
                          {['7','8','9','-'].map(k => <button key={k} onClick={()=>handleCalcInput(k)} className={`aspect-square font-black rounded-xl shadow-[0_3px_0_#94a3b8] active:translate-y-[2px] active:shadow-none text-xl ${['-'].includes(k)?'bg-orange-400 text-white shadow-[0_3px_0_#c2410c]':'bg-white text-slate-800'}`}>{k}</button>)}
                          {['4','5','6','+'].map(k => <button key={k} onClick={()=>handleCalcInput(k)} className={`aspect-square font-black rounded-xl shadow-[0_3px_0_#94a3b8] active:translate-y-[2px] active:shadow-none text-xl ${['+'].includes(k)?'bg-orange-400 text-white shadow-[0_3px_0_#c2410c]':'bg-white text-slate-800'}`}>{k}</button>)}
                          {['1','2','3'].map(k => <button key={k} onClick={()=>handleCalcInput(k)} className="aspect-square bg-white text-slate-800 font-black rounded-xl shadow-[0_3px_0_#94a3b8] active:translate-y-[2px] active:shadow-none text-xl">{k}</button>)}
                          <button onClick={()=>handleCalcInput('=')} className="row-span-2 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl shadow-[0_3px_0_#166534] active:translate-y-[2px] active:shadow-none flex items-center justify-center text-2xl">=</button>
                          <button onClick={()=>handleCalcInput('0')} className="col-span-3 bg-white hover:bg-slate-100 text-slate-800 font-black rounded-xl shadow-[0_3px_0_#94a3b8] active:translate-y-[2px] active:shadow-none py-2 text-xl">0</button>
                      </div>
                      <button onClick={()=>setShowCalculator(false)} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-xl font-bold border-2 border-slate-600 text-sm transition-colors mt-1">ปิดเครื่องคิดเลข</button>
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};