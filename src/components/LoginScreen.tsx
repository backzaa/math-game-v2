import React, { useState, useEffect } from 'react';
// [แก้ไข] เติม type หน้าปีกกา
import type { UserRole, StudentProfile } from '../types';
import { StorageService } from '../services/storage';
// [แก้ไข] ลบ Minus และ X ออก
import { User, Star, GraduationCap, Plus, Divide, Calculator, Infinity, Pi, Sigma } from 'lucide-react';

interface Props {
  onLogin: (role: UserRole, id: string, guestNickname?: string) => void;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto relative overflow-hidden font-sans">
      
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
          <div className="bg-slate-800/95 backdrop-blur-xl p-6 md:p-10 rounded-[40px] border-4 border-slate-700 shadow-2xl flex-1 animate-pop-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-4xl font-black py-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 leading-[2.5] drop-shadow-sm">คิดเลขสนุก BY ครูแบ็ค</h1>
            </div>
            
            <div className="flex bg-slate-700/50 rounded-2xl p-1 mb-8 border border-slate-600">
              <button onClick={() => setActiveTab('STUDENT')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'STUDENT' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>นักเรียน</button>
              <button onClick={() => setActiveTab('TEACHER')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'TEACHER' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>คุณครู</button>
            </div>

            {activeTab === 'STUDENT' ? (
              <div className="space-y-6">
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={24}/>
                  <input type="text" inputMode="numeric" value={studentId} onChange={(e)=>setStudentId(e.target.value.replace(/\D/g,''))} className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl py-4 pl-14 pr-4 text-white text-xl font-bold focus:border-blue-500 outline-none transition-all placeholder:text-[0.8rem]" placeholder="กรุณาใส่เลขที่ตนเอง" />
                </div>
                <p className="text-[0.7rem] md:text-xs text-indigo-100/70 font-bold italic text-center px-2">** หมายเหตุ: โหมดผู้มาเยือน ใส่เลขที่ 00 **</p>
                <button 
                    onClick={() => { 
                        if (studentId === '00') {
                            onLogin('STUDENT', '00', 'ผู้มาเยือน');
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