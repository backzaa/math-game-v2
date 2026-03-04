import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { MathQuestion } from '../types';
import { Dices, CheckCircle2, XCircle, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';

export const PhysicalBoardGame: React.FC = () => {
    const [questions, setQuestions] = useState<MathQuestion[]>([]);
    const [setNumber, setSetNumber] = useState<string>('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ฟังก์ชันสุ่มและดึงโจทย์
    const generateQuestionSet = async () => {
        setIsLoading(true);
        setFeedback('IDLE');
        setCurrentIndex(0);
        setInputValue('');
        setIsFinished(false);

        // สุ่มเลขชุด 001 - 999
        const randomNum = Math.floor(Math.random() * 999) + 1;
        setSetNumber(randomNum.toString().padStart(3, '0'));

        // ดึงโจทย์จากคลัง "เล่นตามใจ" (Freeplay)
        // ต้องมั่นใจว่าโหลดข้อมูลล่าสุดจาก Local (ซึ่ง App.tsx จะเป็นคน Sync ให้)
        const allFreeplay = StorageService.getFreeplayQuestions();
        
        if (!allFreeplay || allFreeplay.length === 0) {
            alert('ยังไม่มีโจทย์ในคลัง "เล่นตามใจ" กรุณาให้คุณครูเพิ่มโจทย์ก่อนครับ');
            setIsLoading(false);
            return;
        }

        // สลับตำแหน่งโจทย์ (Shuffle) แล้วเลือก 10 ข้อ
        const shuffled = [...allFreeplay].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        
        setQuestions(selected);
        
        // จำลองเวลาโหลดให้ดูตื่นเต้น 1 วินาที
        setTimeout(() => setIsLoading(false), 1000);
    };

    useEffect(() => {
        generateQuestionSet();
    }, []);

    const handleCheckAnswer = () => {
        if (!inputValue) return; // ถ้าไม่พิมพ์อะไรเลย ไม่ให้กด
        
        const currentQ = questions[currentIndex];
        const numAnswer = parseInt(inputValue);

        if (numAnswer === currentQ.answer) {
            setFeedback('CORRECT');
        } else {
            setFeedback('WRONG');
        }
    };

    const handleNextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setInputValue('');
            setFeedback('IDLE');
        } else {
            setIsFinished(true);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Mali']">
                <Loader2 size={60} className="text-blue-500 animate-spin mb-4" />
                <h2 className="text-2xl font-bold animate-pulse">กำลังสุ่มชุดโจทย์ลับ...</h2>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Mali'] p-6 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">ไม่พบข้อมูลโจทย์!</h2>
                <p>กรุณาแจ้งคุณครูให้เพิ่มโจทย์ใน "โหมดเล่นตามใจ" ก่อนนะครับ</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Mali'] p-6">
                <div className="bg-slate-800 p-10 rounded-3xl border-4 border-green-500 shadow-2xl text-center max-w-lg w-full animate-pop-in">
                    <Dices size={80} className="text-green-400 mx-auto mb-6 animate-bounce" />
                    <h1 className="text-4xl font-black mb-4">จบชุดโจทย์ที่ #{setNumber}</h1>
                    <p className="text-xl text-slate-300 mb-8">ทำครบ 10 ข้อแล้ว เก่งมากๆ เลย!</p>
                    <button 
                        onClick={generateQuestionSet}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl text-xl transition-all shadow-lg flex justify-center items-center gap-2"
                    >
                        <RefreshCcw /> สุ่มชุดโจทย์ใหม่
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-900 text-white font-['Mali'] flex flex-col p-4 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-md mb-8">
                <div className="text-lg md:text-2xl font-bold text-blue-400">
                    📝 ชุดโจทย์: <span className="text-white">#{setNumber}</span>
                </div>
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-600 font-bold text-slate-300">
                    ข้อที่ {currentIndex + 1} / 10
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
                <div className="bg-slate-800 w-full p-8 md:p-12 rounded-[40px] border-4 border-slate-700 shadow-2xl relative">
                    
                    {/* Question */}
                    <div className="text-center mb-10">
                        <h2 className="text-5xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400 drop-shadow-md">
                            {currentQ.question} = ?
                        </h2>
                    </div>

                    {/* Input Area */}
                    {feedback === 'IDLE' && (
                        <div className="flex flex-col items-center gap-6 animate-pop-in">
                            <input 
                                type="number" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                                className="w-full md:w-2/3 bg-slate-900 border-4 border-blue-500/50 rounded-2xl py-6 px-4 text-center text-4xl md:text-5xl font-black text-white focus:border-blue-400 outline-none transition-all"
                                placeholder="พิมพ์คำตอบ"
                                autoFocus
                            />
                            <button 
                                onClick={handleCheckAnswer}
                                disabled={!inputValue}
                                className={`w-full md:w-2/3 py-5 rounded-2xl text-2xl font-black shadow-xl transition-all transform active:scale-95
                                    ${!inputValue ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'}`}
                            >
                                ตรวจคำตอบ
                            </button>
                        </div>
                    )}

                    {/* Feedback Area (Correct/Wrong) */}
                    {feedback !== 'IDLE' && (
                        <div className="flex flex-col items-center gap-6 animate-pop-in">
                            {feedback === 'CORRECT' ? (
                                <div className="text-center bg-green-900/40 w-full p-6 rounded-3xl border-2 border-green-500">
                                    <CheckCircle2 size={80} className="text-green-400 mx-auto mb-4 animate-bounce" />
                                    <h3 className="text-3xl font-black text-green-400 mb-2">ถูกต้อง! เยี่ยมมาก</h3>
                                    <div className="inline-flex items-center gap-2 bg-green-500 text-slate-900 px-6 py-2 rounded-full font-bold text-xl mt-2 animate-pulse">
                                        <Dices /> ได้สิทธิ์ทอยลูกเต๋า 1 ครั้ง!
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center bg-red-900/40 w-full p-6 rounded-3xl border-2 border-red-500">
                                    <XCircle size={80} className="text-red-400 mx-auto mb-4" />
                                    <h3 className="text-3xl font-black text-red-400 mb-2">ผิดจ้า!</h3>
                                    <p className="text-xl text-slate-300">เฉลยคือ: <span className="text-white font-bold">{currentQ.answer}</span></p>
                                    <div className="inline-flex items-center gap-2 bg-slate-700 text-slate-300 px-6 py-2 rounded-full font-bold mt-4">
                                        พลาดโอกาสทอยเต๋าในรอบนี้ 😢
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleNextQuestion}
                                className="w-full md:w-2/3 bg-white text-slate-900 hover:bg-slate-200 font-black py-5 rounded-2xl text-2xl shadow-xl transition-all flex justify-center items-center gap-2 mt-4"
                            >
                                ข้อต่อไป <ArrowRight />
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};