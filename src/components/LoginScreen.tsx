import React, { useState, useEffect } from 'react';
import type { UserRole } from '../types';
import { StorageService } from '../services/storage';
import { User, GraduationCap, Plus, Divide, Calculator, Infinity, Pi, Sigma, Sparkles, Zap, Trophy, Coins } from 'lucide-react';

// --- รวม Animation และ Keyframes ---
const customStyles = `
/* 1. เอฟเฟคป้ายผู้มาเยือน */
@keyframes scale-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

/* 2. เอฟเฟคชื่อเกม (สีรุ้ง) */
@keyframes text-shine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* 3. เอฟเฟคชื่อเกม (ลอยตัว) */
@keyframes float-title {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

/* 4. เอฟเฟควิบวับ */
@keyframes spin-sparkle {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

/* 5. เอฟเฟคขอบแสงไหล */
@keyframes border-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 6. เอฟเฟคแสงวาบ */
@keyframes flash-glow {
  0%, 100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
  50% { filter: drop-shadow(0 0 20px rgba(255,255,0,0.8)); }
}

/* 7. เอฟเฟคเข้าจากซ้าย (สำหรับนักเรียน) */
@keyframes slide-in-left {
  0% { opacity: 0; transform: translateX(-50px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* 8. เอฟเฟคเข้าจากขวา (สำหรับครู) */
@keyframes slide-in-right {
  0% { opacity: 0; transform: translateX(50px); }
  100% { opacity: 1; transform: translateX(0); }
}
`;

interface Props {
  onLogin: (role: UserRole, id: string, guestNickname?: string, guestAvatar?: string) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('STUDENT');
  const [studentId, setStudentId] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  
  // State ควบคุม Animation
  const [showCard, setShowCard] = useState(false); 
  const [displayData, setDisplayData] = useState<any>(null); 

  const avatars = ['🐯', '🦁', '🐨', '🐼', '🦊', '🐰', '🐸', '🦄', '🐣'];

  // Effect จัดการข้อมูลนักเรียนและการ์ด (แก้ไขล่าสุด)
  useEffect(() => {
    const syncData = async () => {
        console.log("🔄 Auto-Syncing data from Google Sheets...");
        await StorageService.syncFromCloud();
    };
    syncData();
}, []);
  useEffect(() => {
    let showTimer: any;
    let hideTimer: any;

    // ถ้าเลือก Tab ครู ให้ซ่อนการ์ด
    if (activeTab === 'TEACHER') {
        setShowCard(false);
    } 
    // ถ้าเลือก Tab นักเรียน ให้โชว์การ์ดตามข้อมูล
    else {
        if (studentId === '00') {
            const avatar = avatars[Math.floor(Math.random() * avatars.length)];
            setDisplayData({ type: 'GUEST', avatar });
            showTimer = setTimeout(() => setShowCard(true), 50);

        } else if (studentId.length >= 2) {
            const student = StorageService.getStudent(studentId);
            if (student) {
                // [แก้ไข] ใช้ฟังก์ชันดึงยอดเงิน (Balance) ที่เราเพิ่งทำใน storage.ts
                const balanceData = StorageService.getStudentBalance(student.id);
                
                setDisplayData({ 
                    type: 'STUDENT', 
                    student, 
                    score: balanceData.totalScore,      // คะแนนรวมทั้งหมด
                    balance: balanceData.currentBalance // คะแนนที่เหลือใช้ได้
                });
                showTimer = setTimeout(() => setShowCard(true), 50);
            } else {
                // ... (ส่วน else คงเดิม) ...
                setShowCard(false);
                hideTimer = setTimeout(() => setDisplayData(null), 700);
            }
        } else {
            setShowCard(false);
            hideTimer = setTimeout(() => setDisplayData(null), 700);
        }
    }

    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [studentId, activeTab]); // เช็คทั้งเลขที่และ Tab

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto relative overflow-hidden font-['Mali']">
      
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

      <div className="flex flex-col md:flex-row w-full max-w-5xl z-10 py-10 md:items-stretch relative transition-all duration-700 ease-in-out">
          
          {/* --- กล่องซ้าย: Login Form --- */}
          <div className="relative flex-1 animate-pop-in group z-20 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]">
            <div 
                className="absolute -inset-[3px] rounded-[42px] blur-md opacity-75 transition-opacity duration-500"
                style={{
                    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
                    backgroundSize: '300% 300%',
                    animation: 'border-flow 4s ease infinite'
                }}
            ></div>

            <div className="relative bg-slate-800/95 backdrop-blur-xl p-6 md:p-10 rounded-[40px] shadow-2xl h-full border border-white/10">
                <div className="text-center mb-6 relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-48 bg-blue-500/40 blur-[60px] rounded-full animate-pulse"></div>
                    <div className="relative inline-block" style={{ animation: 'float-title 3s ease-in-out infinite' }}>
                        <Sparkles className="absolute -top-8 -left-10 text-yellow-300 w-12 h-12" style={{ animation: 'spin-sparkle 2s infinite' }} />
                        <Sparkles className="absolute -bottom-2 -right-10 text-white w-10 h-10" style={{ animation: 'spin-sparkle 2.5s infinite 1s' }} />
                        <Zap className="absolute top-0 -right-8 text-cyan-300 w-8 h-8 rotate-12 animate-bounce" />
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
                        <div className="mt-[-2px] transform -rotate-2 relative z-20">
                            <div className="inline-block relative">
                                <div className="absolute inset-0 bg-white/20 blur-md rounded-full"></div>
                                <span className="relative bg-white text-slate-900 text-lg md:text-2xl font-black px-6 py-1 rounded-full shadow-[4px_4px_0_rgba(0,0,0,0.3)] border-4 border-slate-900 inline-block tracking-tight">
                                    by ครูแบ็ค
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex bg-slate-700/50 rounded-2xl p-1 mb-8 border border-slate-600">
                    <button onClick={() => setActiveTab('STUDENT')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'STUDENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>นักเรียน</button>
                    <button onClick={() => setActiveTab('TEACHER')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'TEACHER' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>คุณครู</button>
                </div>

                {activeTab === 'STUDENT' ? (
                <div 
                key="student-form" 
                className="space-y-6"
                style={{ animation: 'slide-in-left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}
            >
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

                {/* [เพิ่ม] เงื่อนไข: ถ้าใส่เลข 00 ให้โชว์ช่องกรอกชื่อ */}
                {studentId === '00' ? (
                    <div className="relative mt-4 animate-pop-in">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-400" size={24}/>
                        <input 
                            type="text" 
                            value={guestNameInput} 
                            onChange={(e)=>setGuestNameInput(e.target.value)} 
                            className="w-full bg-slate-900 border-2 border-pink-500/50 rounded-2xl py-5 pl-14 pr-4 text-white text-xl font-bold focus:border-pink-500 outline-none transition-all placeholder:text-lg placeholder:font-bold leading-[3rem]" 
                            placeholder="ชื่อเล่น (เช่น อัครเดช , พรประภา)" 
                            autoFocus
                        />
                    </div>
                ) : (
                    <div className="mt-4 mb-2 flex justify-center">
                        <div 
                            className="bg-yellow-500/20 border-2 border-yellow-400/50 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(250,204,21,0.3)] backdrop-blur-sm"
                            style={{ animation: 'scale-pulse 2.5s infinite ease-in-out' }}
                        >
                            <p className="text-sm md:text-base text-yellow-300 font-bold text-center whitespace-nowrap">
                                ✨ ผู้มาเยือน <span className="text-white text-lg underline decoration-2 underline-offset-4 drop-shadow-md ml-1">ใส่เลขที่ 00</span> ✨
                            </p>
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => { 
                            if (studentId === '00') {
                                if (!guestNameInput.trim()) {
                                    alert('กรุณากรอกชื่อก่อนเริ่มเกมครับ');
                                    return;
                                }
                                // ส่งชื่อและรูปที่สุ่มได้ไปที่ App.tsx
                                onLogin('STUDENT', '00', guestNameInput, displayData?.avatar);
                            } else if (displayData?.student) {
                                onLogin('STUDENT', studentId);
                            } else {
                                alert('ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบเลขที่');
                            }
                        }} 
                    className={`w-full font-bold py-4 rounded-2xl text-xl shadow-lg border-b-4 transition-transform active:scale-95 mt-6
                        ${(studentId === '00' && !guestNameInput.trim()) 
                            ? 'bg-slate-700 text-slate-500 border-slate-900 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-indigo-800'
                        }`}
                    disabled={studentId === '00' && !guestNameInput.trim()}
                >
                    เข้าสู่ระบบ
                </button>
            </div>
                ) : (
                <form 
                    key="teacher-form"
                    onSubmit={(e)=>{e.preventDefault(); const p = (e.target as any).pass.value; if(p==='113513') onLogin('TEACHER','admin'); else alert('รหัสผ่านไม่ถูกต้อง'); }} 
                    className="space-y-4"
                    style={{ animation: 'slide-in-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}
                >
                    <input name="pass" type="password" className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl py-4 px-4 text-white text-xl font-bold" placeholder="รหัสผ่านคุณครู" />
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-xl border-b-4 border-green-800 transition-transform active:scale-95">เข้าสู่ระบบครู</button>
                </form>
                )}
            </div>
          </div>

          {/* --- กล่องขวา: Student Info Card (Animation ขยาย/หด) --- */}
          {displayData && (
              <div 
                className={`
                    relative shrink-0 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                    ${showCard 
                        ? 'w-full md:w-[380px] opacity-100 translate-x-0 mt-6 md:mt-0 md:ml-6'
                        : 'w-0 md:w-0 opacity-0 translate-x-20 mt-0 md:ml-0'
                    }
                `}
              >
                  <div className="w-full md:w-[380px] bg-gradient-to-b from-stone-600 to-stone-900 border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center text-center rounded-[40px] h-full">
                      <div className="p-8 flex flex-col items-center w-full">
                        <div className="relative mb-6 p-2">
                            <div className="absolute -inset-4 bg-amber-400/30 rounded-full blur-xl animate-pulse"></div>
                            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-amber-100 overflow-hidden border-[6px] border-amber-300 relative shadow-2xl mx-auto flex items-center justify-center">
                                {displayData.type === 'GUEST' ? ( 
                                    <div className="text-7xl md:text-8xl animate-float">{displayData.avatar}</div> 
                                ) : displayData.student?.profileImage ? ( 
                                    <img src={displayData.student.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).style.display = 'none'; }} /> 
                                ) : ( 
                                    <div className="w-full h-full flex items-center justify-center bg-amber-200 text-6xl font-black text-amber-600 italic">{displayData.student?.id}</div> 
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-green-500 p-2 rounded-full border-2 border-white shadow-lg animate-bounce"><GraduationCap size={16} className="text-white" /></div>
                        </div>
                        <div className="mb-6 px-4 w-full text-white">
                            {displayData.type === 'GUEST' ? (
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-amber-400 italic tracking-widest uppercase">ยินดีต้อนรับ</h2>
                                    <div className="text-3xl font-black">ผู้มาเยือน</div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl md:text-2xl font-bold mb-2 leading-tight drop-shadow-md">{displayData.student?.firstName} {displayData.student?.lastName}</h2>
                                    <div className="bg-amber-400 text-amber-900 text-xs md:text-sm font-bold uppercase px-4 py-1.5 rounded-full inline-block shadow-md"><span> {displayData.student?.nickname} | ห้อง {displayData.student?.classroom || '-'}  </span></div>
                                </>
                            )}
                        </div>
                        {displayData.type !== 'GUEST' && (
                            <div className="grid grid-cols-2 gap-4 w-full mt-4 animate-pop-in">
                                {/* 1. กล่องซ้าย: คะแนนสะสมรวม (เกียรติยศ) */}
                                <div className="bg-slate-900/80 rounded-2xl p-3 md:p-4 border border-amber-500/30 shadow-inner group transition-transform hover:scale-105">
                                    <div className="flex items-center justify-center gap-1 mb-1 md:mb-2 text-amber-400">
                                        <Trophy size={20} className="animate-bounce" />
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-200">คะแนน<br/>สะสมรวม</span>
                                    </div>
                                    <div className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-tighter">
                                        {(displayData.score || 0).toLocaleString()}
                                    </div>
                                </div>

                                {/* 2. กล่องขวา: คะแนนคงเหลือ (ใช้แลกของ) */}
                                <div className="bg-gradient-to-br from-green-900/80 to-emerald-900/80 rounded-2xl p-3 md:p-4 border border-emerald-500/50 shadow-lg group transition-transform hover:scale-105 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-10 h-10 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="flex items-center justify-center gap-1 mb-1 md:mb-2 text-green-400">
                                        <Coins size={20} className="animate-spin-slow" />
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-green-200">แลกรางวัลได้</span>
                                    </div>
                                    <div className="text-2xl md:text-4xl font-black text-green-300 drop-shadow-md tracking-tighter">
                                        {(displayData.balance || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )}
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};