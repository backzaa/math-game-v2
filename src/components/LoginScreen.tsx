import React, { useState, useEffect } from 'react';
import type { UserRole, StudentProfile } from '../types';
import { StorageService } from '../services/storage';
import { User, Star, GraduationCap, Plus, Divide, Calculator, Infinity, Pi, Sigma, Sparkles, Zap } from 'lucide-react';

// --- รวม Animation ทั้งหมดไว้ตรงนี้ ---
const customStyles = `
/* 1. เอฟเฟคป้ายผู้มาเยือน (ยืดหด) */
@keyframes scale-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

/* 2. เอฟเฟคชื่อเกม (สีรุ้งไหลวน) */
@keyframes text-shine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* 3. เอฟเฟคชื่อเกม (ลอยตัว) */
@keyframes float-title {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

/* 4. เอฟเฟควิบวับรอบชื่อ */
@keyframes spin-sparkle {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

/* 5. เอฟเฟคขอบแสงไหล (Border Flow) */
@keyframes border-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 6. เอฟเฟคแสงวาบ (Flash) */
@keyframes flash-glow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
  50% { filter: drop-shadow(0 0 20px rgba(255,255,0,0.8)); }
}
`;

interface Props {
  onLogin: (role: UserRole, id: string, guestNickname?: string, guestAvatar?: string) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('STUDENT');
  const [studentId, setStudentId] = useState('');
  const [foundStudent, setFoundStudent] = useState<StudentProfile | null>(null);
  const [classroomScore, setClassroomScore] = useState(0);
  
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestAvatar, setGuestAvatar] = useState('🐯');

  const avatars = ['🐯', '🦁', '🐨', '🐼', '🦊', '🐰', '🐸', '🦄', '🐣'];

  useEffect(() => {
    if (studentId === '00') {
        setIsGuestMode(true); 
        setFoundStudent(null);
        setGuestAvatar(avatars[Math.floor(Math.random() * avatars.length)]);
    } else if (studentId.length >= 1) {
        setIsGuestMode(false);
        const student = StorageService.getStudent(studentId);
        if (student) {
            setFoundStudent(student);
            const score = student.sessions ? student.sessions.filter(s => s.mode === 'CLASSROOM').reduce((sum, s) => sum + (s.score || 0), 0) : 0;
            setClassroomScore(score);
        } else { setFoundStudent(null); }
    } else { setFoundStudent(null); setIsGuestMode(false); }
  }, [studentId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto relative overflow-hidden font-['Mali']">
      
      {/* ใส่ Style Animation */}
      <style>{customStyles}</style>

      {/* Background Decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
         <Plus className="absolute top-[10%] left-[5%] text-white w-12 h-12 animate-float" />
         <Divide className="absolute bottom-[15%] left-[15%] text-white w-14 h-14 animate-spin-slow" />
         <Calculator className="absolute top-[15%] left-[25%] text-white w-10 h-10 animate-bounce" />
         <Pi className="absolute top-10 right-10 text-white w-16 h-16 animate-float" />
         <Infinity className="absolute top-1/2 right-1/4 text-white w-12 h-12 animate-float" />
         <Sigma className="absolute bottom-10 right-20 text-white w-14 h-14 animate-pulse" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl z-10 py-10 md:items-stretch">
          
          {/* --- กล่องหลัก (Main Container) --- */}
          <div className="relative flex-1 animate-pop-in group">
            
            {/* 1. เลเยอร์แสงเบลอ (Glowing Border) */}
            <div 
                className="absolute -inset-[3px] rounded-[42px] blur-md opacity-75 transition-opacity duration-500"
                style={{
                    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                    backgroundSize: '300% 300%',
                    animation: 'border-flow 4s ease infinite'
                }}
            ></div>

            {/* 2. กล่องเนื้อหาจริง */}
            <div className="relative bg-slate-800/95 backdrop-blur-xl p-6 md:p-10 rounded-[40px] shadow-2xl h-full border border-white/10">
                
                {/* --- ส่วนหัวข้อเกมสุดอลังการ (ปรับปรุงใหม่) --- */}
                <div className="text-center mb-6 relative z-10">
                    {/* แสงด้านหลังชื่อ */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-48 bg-blue-500/40 blur-[60px] rounded-full animate-pulse"></div>
                    
                    <div className="relative inline-block" style={{ animation: 'float-title 3s ease-in-out infinite' }}>
                        {/* ไอคอนตกแต่งรอบๆ */}
                        <Sparkles className="absolute -top-8 -left-10 text-yellow-300 w-12 h-12" style={{ animation: 'spin-sparkle 2s infinite' }} />
                        <Sparkles className="absolute -bottom-2 -right-10 text-white w-10 h-10" style={{ animation: 'spin-sparkle 2.5s infinite 1s' }} />
                        <Zap className="absolute top-0 -right-8 text-cyan-300 w-8 h-8 rotate-12 animate-bounce" />

                        {/* ชื่อเกมหลัก: เพิ่ม leading-[1.6] และ py-6 เพื่อให้สระอุไม่ขาด */}
                        <h1 
                            className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400 drop-shadow-2xl py-6 leading-[1.6] tracking-tighter" 
                            style={{ 
                                backgroundImage: 'linear-gradient(to right, #fbbf24, #f472b6, #22d3ee, #fbbf24)', 
                                backgroundSize: '200% auto',
                                animation: 'text-shine 3s linear infinite, flash-glow 3s infinite',
                                filter: 'drop-shadow(0px 6px 0px rgba(0,0,0,0.5))',
                                WebkitTextStroke: '2.5px white',
                            }}
                        >
                            คิดเลขสนุก
                        </h1>
                        
                        {/* ชื่อครู: ปรับ mt เป็น -2px (ห่างขึ้น) และขนาดตัวอักษรเท่าเดิม */}
                        <div className="mt-[-2px] transform -rotate-2 relative z-20">
                            <div className="inline-block relative">
                                {/* แสงรองหลังป้ายชื่อครู */}
                                <div className="absolute inset-0 bg-white/20 blur-md rounded-full"></div>
                                <span className="relative bg-white text-slate-900 text-lg md:text-2xl font-black px-6 py-1 rounded-full shadow-[4px_4px_0_rgba(0,0,0,0.3)] border-4 border-slate-900 inline-block tracking-tight">
                                    by ครูแบ็ค
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ------------------------------------------- */}
                
                <div className="flex bg-slate-700/50 rounded-2xl p-1 mb-8 border border-slate-600">
                    <button onClick={() => setActiveTab('STUDENT')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'STUDENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>นักเรียน</button>
                    <button onClick={() => setActiveTab('TEACHER')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'TEACHER' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>คุณครู</button>
                </div>

                {activeTab === 'STUDENT' ? (
                <div className="space-y-6">
                    <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={24}/>
                        <input 
                            type="text" 
                            inputMode="numeric" 
                            value={studentId} 
                            onChange={(e)=>setStudentId(e.target.value.replace(/\D/g,''))} 
                            className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl py-5 pl-14 pr-4 text-white text-xl font-bold focus:border-blue-500 outline-none transition-all placeholder:text-lg placeholder:font-bold leading-[3rem]" 
                            placeholder="ใส่เลขที่ตนเอง" 
                        />
                    </div>

                    <div className="mt-4 mb-2 flex justify-center">
                        <div 
                            className="bg-yellow-500/20 border-2 border-yellow-400/50 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(250,204,21,0.3)] backdrop-blur-sm"
                            style={{ animation: 'scale-pulse 2.5s infinite ease-in-out' }}
                        >
                            <p className="text-sm md:text-base text-yellow-300 font-bold text-center">
                                ✨ หมายเหตุ: โหมดผู้มาเยือน <span className="text-white text-lg underline decoration-2 underline-offset-4 drop-shadow-md ml-1">ใส่เลขที่ 00</span> ✨
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => { 
                                if (studentId === '00') {
                                    onLogin('STUDENT', '00', 'ผู้มาเยือน', guestAvatar);
                                } else if (foundStudent) {
                                    onLogin('STUDENT', studentId);
                                } else {
                                    alert('ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบเลขที่');
                                }
                            }} 
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-2xl text-xl shadow-lg border-b-4 border-indigo-800 transition-transform active:scale-95"
                    >
                        เข้าสู่ระบบ
                    </button>
                </div>
                ) : (
                <form onSubmit={(e)=>{e.preventDefault(); const p = (e.target as any).pass.value; if(p==='admin') onLogin('TEACHER','admin'); else alert('รหัสผ่านไม่ถูกต้อง'); }} className="space-y-4">
                    <input name="pass" type="password" className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl py-4 px-4 text-white text-xl font-bold" placeholder="รหัสผ่านคุณครู" />
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-xl border-b-4 border-green-800 transition-transform active:scale-95">เข้าสู่ระบบครู</button>
                </form>
                )}
            </div>
          </div>

          {(foundStudent || isGuestMode) && (
              <div className="w-full md:w-[380px] bg-slate-800 border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center text-center animate-slide-in-right shrink-0 overflow-hidden relative rounded-[60px]">
                  <div className="p-8 flex flex-col items-center w-full">
                    <div className="relative mb-6 p-2">
                        <div className="absolute -inset-4 bg-amber-400/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-amber-100 overflow-hidden border-[6px] border-amber-300 relative shadow-2xl mx-auto flex items-center justify-center">
                            {isGuestMode ? ( 
                                <div className="text-7xl md:text-8xl animate-float">{guestAvatar}</div> 
                            ) : foundStudent?.profileImage ? ( 
                                <img src={foundStudent.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).style.display = 'none'; }} /> 
                            ) : ( 
                                <div className="w-full h-full flex items-center justify-center bg-amber-200 text-6xl font-black text-amber-600 italic">{foundStudent?.id}</div> 
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-green-500 p-2 rounded-full border-2 border-white shadow-lg animate-bounce"><GraduationCap size={16} className="text-white" /></div>
                    </div>
                    <div className="mb-6 px-4 w-full text-white">
                        {isGuestMode ? (
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-amber-400 italic tracking-widest uppercase">ยินดีต้อนรับ</h2>
                                <div className="text-3xl font-black">ผู้มาเยือน</div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl md:text-4xl font-bold mb-2 leading-tight drop-shadow-md">{foundStudent?.firstName}</h2>
                                <div className="bg-amber-400 text-amber-900 text-xs md:text-sm font-bold uppercase px-4 py-1.5 rounded-full inline-block shadow-md"><span>ห้อง {foundStudent?.classroom || '-'} | {foundStudent?.nickname}</span></div>
                            </>
                        )}
                    </div>
                    {!isGuestMode && (
                        <div className="bg-slate-900/80 rounded-[40px] p-6 w-full border-2 border-amber-500/30 shadow-inner group transition-transform hover:scale-105">
                            <div className="flex items-center justify-center gap-2 mb-2 text-amber-400">
                                <Star size={24} fill="currentColor" className="animate-spin-slow" />
                                <span className="text-sm font-bold uppercase tracking-widest text-amber-200">คะแนนสะสมรวม</span>
                            </div>
                            <div className="text-5xl md:text-6xl font-black text-white drop-shadow-lg tracking-tighter">{classroomScore}</div>
                        </div>
                    )}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};