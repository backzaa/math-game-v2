import React, { useState, useEffect } from 'react';
import type { MathQuestion } from '../types';
// [แก้ไข] ลบ X ออก
import { Clock, Check, Delete, Calculator } from 'lucide-react';

interface Props {
  question: MathQuestion | null;
  volume?: number;
  calculatorUsesLeft?: number;
  onConsumeCalculator?: () => void;
  onAnswer: (isCorrect: boolean, usedCalculator: boolean) => void;
}

export const MathModal: React.FC<Props> = ({ 
  question, 
  onAnswer, 
  calculatorUsesLeft = 0, 
  onConsumeCalculator 
}) => {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [usedCalc, setUsedCalc] = useState(false);

  useEffect(() => {
    setAnswer('');
    setTimeLeft(30);
    setUsedCalc(false);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // หมดเวลา (ส่ง true ไปบอกว่าเป็น Timeout)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [question]);

  if (!question) return null;

  const handleNumClick = (num: string) => {
    if (answer.length < 5) setAnswer(prev => prev + num);
  };

  const handleDelete = () => {
    setAnswer(prev => prev.slice(0, -1));
  };

  const handleUseCalculator = () => {
    if (calculatorUsesLeft > 0 && !usedCalc) {
      setUsedCalc(true);
      if (onConsumeCalculator) onConsumeCalculator();
      setAnswer(question.answer.toString());
    }
  };

  // [แก้ไข] ลบ forceSubmit ออก เหลือแค่ isTimeout
  const handleSubmit = (isTimeout = false) => {
    if (isTimeout) {
      onAnswer(false, usedCalc);
    } else {
      const isCorrect = parseInt(answer) === question.answer;
      onAnswer(isCorrect, usedCalc);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border-8 border-indigo-500 relative">
        
        {/* Header */}
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Clock className={timeLeft < 10 ? 'animate-pulse text-red-300' : ''} />
            <span>{timeLeft} วินาที</span>
          </div>
          {calculatorUsesLeft > 0 && !usedCalc && (
             <button onClick={handleUseCalculator} className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition">
                <Calculator size={14}/> ตัวช่วย ({calculatorUsesLeft})
             </button>
          )}
        </div>

        {/* Question */}
        <div className="p-8 text-center bg-indigo-50">
          <div className="text-5xl font-black text-slate-700 mb-4 font-mono tracking-widest drop-shadow-sm">
            {question.question} = ?
          </div>
          <div className={`h-20 bg-white border-4 rounded-2xl flex items-center justify-center text-5xl font-bold shadow-inner ${usedCalc ? 'border-yellow-400 text-yellow-600' : 'border-indigo-200 text-indigo-600'}`}>
            {answer || <span className="text-slate-300 animate-pulse">_</span>}
          </div>
        </div>

        {/* Numpad */}
        <div className="p-4 bg-slate-100 grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleNumClick(num.toString())} className="bg-white p-3 rounded-xl shadow-sm text-2xl font-bold text-slate-700 active:bg-indigo-50 border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all">
              {num}
            </button>
          ))}
          <button onClick={() => handleNumClick('0')} className="bg-white p-3 rounded-xl shadow-sm text-2xl font-bold text-slate-700 active:bg-indigo-50 border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all col-span-2">0</button>
          <button onClick={handleDelete} className="bg-red-100 p-3 rounded-xl shadow-sm text-red-500 active:bg-red-200 border-b-4 border-red-200 active:border-b-0 active:translate-y-1 transition-all flex justify-center items-center"><Delete /></button>
        </div>

        {/* Submit Button */}
        <div className="p-4 bg-white border-t border-slate-100">
          <button 
            // [แก้ไข] ไม่ต้องส่งค่าอะไรไป (เพราะไม่ใช่ Timeout)
            onClick={() => handleSubmit()}
            disabled={!answer}
            className={`w-full py-3 rounded-xl text-xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 ${!answer ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 border-b-4 border-green-700 active:border-b-0 active:translate-y-1'}`}
          >
            <Check size={24} strokeWidth={4} />
            ตอบคำถาม
          </button>
        </div>
      </div>
    </div>
  );
};