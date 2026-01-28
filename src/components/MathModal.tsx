import React, { useState, useEffect } from 'react';
import type { MathQuestion } from '../types';
import { Calculator } from 'lucide-react'; // ลบ Clock ออก

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
  // ไม่ต้องมี state สำหรับเวลา (timeLeft) แล้ว
  const [options, setOptions] = useState<number[]>([]);
  const [usedCalc, setUsedCalc] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (!question) return;

    // รีเซ็ตค่าเริ่มต้น (ไม่มีรีเซ็ตเวลา)
    setUsedCalc(false);
    setSelectedOption(null);

    // ระบบสุ่มตัวเลือกเหมือนเดิม
    let currentOptions = question.options || [];
    if (!currentOptions || currentOptions.length === 0) {
       const ans = question.answer;
       const set = new Set<number>();
       set.add(ans);
       while(set.size < 4) {
           const offset = Math.floor(Math.random() * 10) - 5; 
           const val = ans + offset;
           if (val > 0 && val !== ans) set.add(val);
           else if (val <= 0) set.add(ans + set.size + 1);
       }
       currentOptions = Array.from(set).sort(() => Math.random() - 0.5);
    } else {
        currentOptions = [...currentOptions].sort(() => Math.random() - 0.5);
    }
    setOptions(currentOptions);
    
    // *** ลบส่วน setInterval จับเวลาออกไปเลย ***
  }, [question]);

  if (!question) return null;

  const handleOptionClick = (option: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    
    const isCorrect = option === question.answer;
    
    setTimeout(() => {
        onAnswer(isCorrect, usedCalc);
    }, 500);
  };

  const handleUseCalculator = () => {
    if (calculatorUsesLeft > 0 && !usedCalc) {
      setUsedCalc(true);
      if (onConsumeCalculator) onConsumeCalculator();
      setOptions([question.answer]);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-pop-in">
      <div className="bg-white rounded-[40px] shadow-[0_0_50px_rgba(79,70,229,0.3)] w-full max-w-md overflow-hidden border-8 border-indigo-600 relative flex flex-col">
        
        {/* Header (เหลือแค่ปุ่มตัวช่วย) */}
        <div className="bg-indigo-600 p-4 flex justify-end items-center text-white z-10 h-16">
          {calculatorUsesLeft > 0 && !usedCalc && (
             <button onClick={handleUseCalculator} className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-black shadow-lg hover:scale-105 transition active:scale-95 border-2 border-yellow-200">
                <Calculator size={20}/> ตัวช่วย ({calculatorUsesLeft})
             </button>
          )}
        </div>

        {/* โจทย์ (ปรับให้ใหญ่ขึ้นเพราะที่ว่างเยอะขึ้น) */}
        <div className="p-10 text-center bg-indigo-50 flex-1 flex flex-col justify-center items-center">
          <div className="text-6xl md:text-7xl font-black text-slate-700 mb-4 font-mono tracking-widest drop-shadow-sm">
            {question.question}
          </div>
          <div className="text-4xl text-slate-400 font-bold">= ?</div>
        </div>

        {/* ปุ่มตัวเลือก */}
        <div className="p-6 bg-slate-100 grid grid-cols-2 gap-4">
          {options.map((opt, idx) => {
             let btnClass = "bg-white text-slate-700 hover:bg-indigo-50 border-slate-200"; 
             if (selectedOption !== null) {
                 if (opt === question.answer) btnClass = "bg-green-500 text-white border-green-600 shadow-[0_4px_0_#15803d]"; 
                 else if (opt === selectedOption) btnClass = "bg-red-500 text-white border-red-600 shadow-[0_4px_0_#b91c1c]"; 
                 else btnClass = "bg-slate-200 text-slate-400 opacity-50"; 
             } else {
                 btnClass += " shadow-[0_6px_0_#cbd5e1] active:shadow-none active:translate-y-2 border-b-4";
             }

             return (
                <button 
                    key={idx} 
                    onClick={() => handleOptionClick(opt)}
                    disabled={selectedOption !== null}
                    className={`h-24 rounded-2xl text-4xl font-black transition-all flex items-center justify-center border-2 ${btnClass}`}
                >
                    {opt}
                </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};