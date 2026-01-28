import React, { useState, useEffect } from 'react';
import type { MathQuestion } from '../types';
import { Clock, Calculator } from 'lucide-react';

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
  const [timeLeft, setTimeLeft] = useState(30);
  const [options, setOptions] = useState<number[]>([]);
  const [usedCalc, setUsedCalc] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (!question) return;

    // รีเซ็ตค่าเริ่มต้น
    setTimeLeft(30);
    setUsedCalc(false);
    setSelectedOption(null);

    // เตรียมตัวเลือก (ถ้าโจทย์มี options ก็ใช้เลย ถ้าไม่มีให้สุ่มสร้างเอง)
    let currentOptions = question.options || [];
    
    if (!currentOptions || currentOptions.length === 0) {
       // ระบบสร้างตัวหลอกอัตโนมัติ (กรณีข้อมูลไม่ครบ)
       const ans = question.answer;
       const set = new Set<number>();
       set.add(ans);
       while(set.size < 4) {
           const offset = Math.floor(Math.random() * 10) - 5; // สุ่มบวกลบ 5
           const val = ans + offset;
           if (val > 0 && val !== ans) set.add(val);
           else if (val <= 0) set.add(ans + set.size + 1); // กันค่าติดลบ
       }
       currentOptions = Array.from(set).sort(() => Math.random() - 0.5); // สลับตำแหน่ง
    } else {
        // ถ้ามี options มาแล้ว ก็สลับตำแหน่งหน่อย เพื่อความสนุก
        currentOptions = [...currentOptions].sort(() => Math.random() - 0.5);
    }
    
    setOptions(currentOptions);
    
    // จับเวลา
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAnswer(false, usedCalc); // หมดเวลา
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [question]);

  if (!question) return null;

  const handleOptionClick = (option: number) => {
    if (selectedOption !== null) return; // ป้องกันกดซ้ำ
    setSelectedOption(option);
    
    const isCorrect = option === question.answer;
    
    // หน่วงเวลานิดนึงให้เห็นสีปุ่มว่าถูกหรือผิด
    setTimeout(() => {
        onAnswer(isCorrect, usedCalc);
    }, 500);
  };

  const handleUseCalculator = () => {
    if (calculatorUsesLeft > 0 && !usedCalc) {
      setUsedCalc(true);
      if (onConsumeCalculator) onConsumeCalculator();
      // ตัวช่วย: ตัดตัวเลือกผิดออกหมด เหลือแค่ข้อถูก
      setOptions([question.answer]);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-md overflow-hidden border-8 border-indigo-500 relative flex flex-col">
        
        {/* Header (เวลา & ตัวช่วย) */}
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center gap-2 font-bold text-xl bg-indigo-800/50 px-3 py-1 rounded-full">
            <Clock size={20} className={timeLeft < 10 ? 'animate-pulse text-red-300' : ''} />
            <span>{timeLeft} วินาที</span>
          </div>
          
          {calculatorUsesLeft > 0 && !usedCalc && (
             <button onClick={handleUseCalculator} className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs md:text-sm font-black shadow-lg hover:scale-105 transition active:scale-95 border-2 border-yellow-200">
                <Calculator size={16}/> ตัวช่วย ({calculatorUsesLeft})
             </button>
          )}
        </div>

        {/* โจทย์ */}
        <div className="p-8 text-center bg-indigo-50 flex-1 flex flex-col justify-center items-center">
          <div className="text-5xl md:text-6xl font-black text-slate-700 mb-2 font-mono tracking-widest drop-shadow-sm">
            {question.question}
          </div>
          <div className="text-3xl text-slate-400 font-bold">= ?</div>
        </div>

        {/* ปุ่มตัวเลือก (4 ปุ่ม) */}
        <div className="p-6 bg-slate-100 grid grid-cols-2 gap-4">
          {options.map((opt, idx) => {
             // ตรวจสอบสถานะสีปุ่ม
             let btnClass = "bg-white text-slate-700 hover:bg-indigo-50 border-slate-200"; // ปกติ
             if (selectedOption !== null) {
                 if (opt === question.answer) btnClass = "bg-green-500 text-white border-green-600 shadow-[0_4px_0_#15803d]"; // เฉลยถูก
                 else if (opt === selectedOption) btnClass = "bg-red-500 text-white border-red-600 shadow-[0_4px_0_#b91c1c]"; // ตอบผิด
                 else btnClass = "bg-slate-200 text-slate-400 opacity-50"; // ข้ออื่นๆ
             } else {
                 // สีปกติ
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