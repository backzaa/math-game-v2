import React, { useState } from 'react';
import type { MathQuestion } from '../types'; // แก้บรรทัดนี้ครับ
import { Calculator, CheckCircle2, XCircle, Frown, PartyPopper } from 'lucide-react';

interface Props {
  question: MathQuestion | null;
  onAnswer: (correct: boolean, usedCalculator: boolean) => void;
  volume: number;
  calculatorUsesLeft: number;
  onConsumeCalculator: () => void;
}

const SFX = {
  CORRECT: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
  WRONG: new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3')
};

export const MathModal: React.FC<Props> = ({ question, onAnswer, volume, calculatorUsesLeft, onConsumeCalculator }) => {
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
        utterance.rate = 1.0; 
        window.speechSynthesis.speak(utterance);
    }
  };

  if (!question) return null;

  const handleAnswerClick = (isCorrect: boolean) => {
    if (feedback.show) return;
    
    playSound(isCorrect);
    setFeedback({ isCorrect, show: true });
    
    // [แก้ไข] เพิ่มการพูดเฉลยคำตอบ
    if (isCorrect) {
        speak("เก่งมาก ถูกต้องครับ");
    } else {
        speak(`ผิดนิดนึง คำตอบคือ ${question.answer} ครับ`); 
    }
    
    setTimeout(() => {
      onAnswer(isCorrect, usedCalcInThisQuestion);
      setFeedback({ isCorrect: false, show: false });
      setShowCalculator(false);
      setUsedCalcInThisQuestion(false);
      setCalcDisplay('0');
    }, 3000); // [แนะนำ] เพิ่มเวลาโชว์เป็น 3 วินาที (3000) จะได้อ่านเฉลยทัน
  };

  const activateCalculator = () => {
      if (calculatorUsesLeft > 0 && !feedback.show) {
          setShowCalculator(true);
          if (!usedCalcInThisQuestion) {
              onConsumeCalculator(); 
              setUsedCalcInThisQuestion(true);
          }
      }
  };

  const handleCalcInput = (val: string) => {
      if(val === 'C') setCalcDisplay('0');
      else if(val === '=') {
          try { setCalcDisplay(eval(calcDisplay).toString()); } catch(e) { setCalcDisplay('Error'); }
      } else setCalcDisplay(prev => prev === '0' ? val : prev + val);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-pop-in">
      {feedback.show && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md">
           <div className={`p-10 rounded-3xl text-center border-8 shadow-2xl flex flex-col items-center gap-6 scale-110 ${feedback.isCorrect ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'}`}>
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 size={140} className="text-white animate-bounce" />
                  <div><h2 className="text-6xl font-black text-white drop-shadow-lg mb-2">ถูกต้อง!</h2></div>
                  {usedCalcInThisQuestion && <div className="text-yellow-300 font-bold bg-black/30 px-4 py-1 rounded-full">+5 คะแนน (ใช้ตัวช่วย)</div>}
                  {!usedCalcInThisQuestion && <div className="text-white font-bold bg-black/30 px-4 py-1 rounded-full">+10 คะแนน</div>}
                  <PartyPopper size={60} className="text-yellow-300 animate-spin-slow" />
                </>
              ) : (
                <>
                  <XCircle size={140} className="text-white animate-pulse" />
                  <div><h2 className="text-6xl font-black text-white drop-shadow-lg mb-2">ผิดนิดนึง</h2></div>
                  
                  {/* [เพิ่มใหม่] ส่วนแสดงเฉลยคำตอบ */}
                  <div className="bg-white/20 px-6 py-2 rounded-xl backdrop-blur-sm mt-2 mb-4 border-2 border-white/30">
                      <p className="text-xl text-slate-200">คำตอบที่ถูกคือ</p>
                      <p className="text-5xl font-black text-yellow-300 drop-shadow-md">{question.answer}</p>
                  </div>

                  <Frown size={60} className="text-slate-200" />
                </>
              )}
           </div>
        </div>
      )}

       <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border-4 border-slate-600 max-w-2xl w-full p-8 relative shadow-2xl">
          {showCalculator && (
              <div className="absolute inset-0 z-10 bg-slate-800 rounded-2xl p-4 flex flex-col border-4 border-orange-500">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-orange-400 font-bold flex items-center gap-2"><Calculator/> เครื่องคิดเลข</span>
                      <span className="text-xs text-slate-400">ใช้สิทธิ์แล้ว</span>
                  </div>
                  <div className="bg-black text-green-400 font-mono text-4xl p-4 text-right rounded mb-4 shadow-inner">{calcDisplay}</div>
                  <div className="grid grid-cols-4 gap-2 flex-1">
                      {[7,8,9,'/',4,5,6,'*',1,2,3,'-',0,'C','=','+'].map(b => (
                          <button key={b} onClick={()=>handleCalcInput(b.toString())} className="bg-slate-700 text-white text-xl font-bold rounded hover:bg-slate-600 active:scale-95 transition">{b}</button>
                      ))}
                  </div>
                  <button onClick={()=>setShowCalculator(false)} className="mt-4 bg-red-500 text-white py-3 rounded-lg font-bold">ซ่อนเครื่องคิดเลข</button>
              </div>
          )}

          <div className="mb-8 text-center">
            <h2 className="text-2xl text-slate-400 font-bold mb-4">คำถามคณิตศาสตร์</h2>
            <div className="bg-black/40 rounded-2xl p-6 border-2 border-slate-500">
                 <span className="text-6xl font-mono text-white font-bold tracking-wider">{question.question} = ?</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {question.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswerClick(opt === question.answer)} className="bg-white hover:bg-blue-50 active:scale-95 text-slate-900 text-5xl font-bold py-6 rounded-2xl shadow-[0_6px_0_#cbd5e1] border-2 border-slate-300 transition-all hover:-translate-y-1">
                {opt}
              </button>
            ))}
          </div>
          
          <div className="flex justify-center border-t border-slate-700 pt-6">
              <button 
                disabled={calculatorUsesLeft <= 0 && !usedCalcInThisQuestion} 
                onClick={activateCalculator} 
                className={`flex flex-col items-center gap-2 group ${calculatorUsesLeft <= 0 && !usedCalcInThisQuestion ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 transition'}`}
              >
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-orange-500/50 border-4 border-orange-400 relative">
                      <Calculator color="white" size={32}/>
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                          {calculatorUsesLeft}
                      </div>
                  </div>
                  <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-orange-400">เครื่องคิดเลข</span>
                      <span className="text-[10px] text-slate-500">เหลือ {calculatorUsesLeft} ครั้ง (คะแนนหาร 2)</span>
                  </div>
              </button>
          </div>
       </div>
    </div>
  );
};