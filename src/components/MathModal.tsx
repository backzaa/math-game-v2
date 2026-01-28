import React, { useState, useEffect } from 'react';
import type { MathQuestion } from '../types';
// [แก้ไข] ลบ Calculator ออก
import { Clock, Check, X, Delete } from 'lucide-react';

interface Props {
  question: MathQuestion;
  onAnswer: (isCorrect: boolean, timeUsed: number, userAnswer: string) => void;
  onClose: () => void;
}

export const MathModal: React.FC<Props> = ({ question, onAnswer, onClose }) => {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30); 
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNumClick = (num: string) => {
    if (answer.length < 5) setAnswer(prev => prev + num);
  };

  const handleDelete = () => {
    setAnswer(prev => prev.slice(0, -1));
  };

  const handleSubmit = (isTimeout = false) => {
    const timeUsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (isTimeout) {
      onAnswer(false, 30, "TIMEOUT"); 
    } else {
      const isCorrect = parseInt(answer) === question.answer;
      onAnswer(isCorrect, timeUsed, answer); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border-8 border-indigo-500">
        {/* Header */}
        <div className="bg-indigo-500 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <Clock className={timeLeft < 10 ? 'animate-pulse text-red-300' : ''} />
            <span>{timeLeft} วินาที</span>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/40"><X /></button>
        </div>

        {/* Question */}
        <div className="p-8 text-center bg-indigo-50">
          <div className="text-6xl font-black text-slate-700 mb-4 font-mono tracking-widest drop-shadow-sm">
            {question.question} = ?
          </div>
          <div className="h-20 bg-white border-4 border-indigo-200 rounded-2xl flex items-center justify-center text-5xl font-bold text-indigo-600 shadow-inner">
            {answer || <span className="text-slate-300 animate-pulse">_</span>}
          </div>
        </div>

        {/* Numpad */}
        <div className="p-6 bg-slate-100 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleNumClick(num.toString())} className="bg-white p-4 rounded-xl shadow-[0_4px_0_#cbd5e1] active:shadow-none active:translate-y-1 text-2xl font-bold text-slate-700 hover:bg-indigo-50 transition-all border-2 border-slate-200">
              {num}
            </button>
          ))}
          <button onClick={() => handleNumClick('0')} className="bg-white p-4 rounded-xl shadow-[0_4px_0_#cbd5e1] active:shadow-none active:translate-y-1 text-2xl font-bold text-slate-700 hover:bg-indigo-50 border-2 border-slate-200 col-span-2">0</button>
          <button onClick={handleDelete} className="bg-red-100 p-4 rounded-xl shadow-[0_4px_0_#fca5a5] active:shadow-none active:translate-y-1 text-red-500 hover:bg-red-200 border-2 border-red-200 flex justify-center items-center"><Delete /></button>
        </div>

        {/* Submit Button */}
        <div className="p-6 bg-white border-t-2 border-slate-100">
          <button 
            onClick={() => handleSubmit(false)}
            disabled={!answer}
            className={`w-full py-4 rounded-2xl text-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 ${!answer ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 shadow-[0_6px_0_#15803d] active:shadow-none active:translate-y-2'}`}
          >
            <Check size={32} strokeWidth={4} />
            ตอบคำถาม
          </button>
        </div>
      </div>
    </div>
  );
};