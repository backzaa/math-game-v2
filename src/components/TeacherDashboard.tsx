import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { StudentProfile, MathQuestion, CharacterBase, SkinColor, Gender, ScoringMode } from '../types';
import { LogOut, Trash2, UserPlus, Users, Palette, Star, Gamepad2, Save, Calendar, Edit3, PlusCircle, Music, Shuffle, HardDrive, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, BarChart, AlertTriangle, Lock } from 'lucide-react';

interface Props {
  onLogout: () => void;
  onUpdateBgm?: (url: string) => void;
  onUpdateQuestions?: (qs: MathQuestion[]) => void;
}

// ฟังก์ชันแปลงลิงก์ Google Drive
const getDirectImageLink = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com') || url.includes('drive.google.com/file/d/')) {
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
             return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
    }
    return url;
};

export const TeacherDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'QUESTIONS' | 'STUDENTS' | 'ASSETS'>('REPORTS');
  const [reportMode, setReportMode] = useState<ScoringMode>('CLASSROOM');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  const [questionSettingMode, setQuestionSettingMode] = useState<'CLASSROOM' | 'FREEPLAY'>('CLASSROOM');
  
  const [randomConfig, setRandomConfig] = useState({ 
      count: 10, 
      min: 1, 
      max: 20, 
      operators: { add: true, sub: true, mul: false, div: false } 
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<MathQuestion[]>([]);
  const [newCustomQ, setNewCustomQ] = useState({ q: '', opts: ['', '', '', ''], correctIdx: 0 });

  const [gameConfig, setGameConfig] = useState<{ themeBackgrounds: Record<string, string>, bgmPlaylist: string[] }>({ themeBackgrounds: {}, bgmPlaylist: [] });
  const [bgmInput, setBgmInput] = useState('');

  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState({ id: '', firstName: '', lastName: '', nickname: '', gender: 'MALE' as Gender, classroom: '', profileImage: '', base: 'BOY' as CharacterBase, skinColor: '#fcd34d' as SkinColor });

  // --- [ส่วนที่แก้ไข] States สำหรับระบบลบ (รองรับทั้งนักเรียนและคะแนน) ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'STUDENT' | 'SESSION'>('STUDENT'); // เช็คว่ากำลังลบอะไร
  const [studentToDelete, setStudentToDelete] = useState<StudentProfile | null>(null); // เก็บข้อมูลนักเรียนที่จะลบ
  const [sessionToDelete, setSessionToDelete] = useState<{sid: string, sessId: string} | null>(null); // เก็บข้อมูลคะแนนที่จะลบ
  const [deleteStep, setDeleteStep] = useState<'CONFIRM' | 'PASSWORD'>('CONFIRM');
  const [deletePassword, setDeletePassword] = useState('');
  // -------------------------------------------------------------------

  // State สำหรับเก็บว่ากำลังเปิดดูรายละเอียดของรอบเล่นไหนอยู่
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const THEME_IDS = [{ id: 'jungle', label: 'ป่ามหาสนุก' }, { id: 'space', label: 'ผจญภัยอวกาศ' }, { id: 'boat', label: 'ล่องเรือ' }, { id: 'ocean', label: 'ดำน้ำ' }, { id: 'volcano', label: 'ภูเขาไฟ' }, { id: 'candy', label: 'เมืองขนมหวาน' }, { id: 'castle', label: 'ปราสาท' }];

  const loadDataFromLocal = () => {
      setStudents(StorageService.getAllStudents());
      const cfg = StorageService.getGameConfig();
      if(cfg) {
          setGameConfig({ themeBackgrounds: cfg.themeBackgrounds || {}, bgmPlaylist: cfg.bgmPlaylist || [] });
          setBgmInput((cfg.bgmPlaylist || []).join('\n'));
      }
      let currentQs: MathQuestion[] = [];
      if (questionSettingMode === 'CLASSROOM') {
          currentQs = StorageService.getDailyQuestions();
      } else {
          currentQs = StorageService.getFreeplayQuestions();
      }
      setGeneratedQuestions(Array.isArray(currentQs) ? currentQs : []);
  };

  useEffect(() => { loadDataFromLocal(); }, [activeTab, questionSettingMode]);

  const toggleSessionDetails = (sessionId: string) => {
      setExpandedSessions(prev => {
          const newSet = new Set(prev);
          if (newSet.has(sessionId)) newSet.delete(sessionId);
          else newSet.add(sessionId);
          return newSet;
      });
  };

  const handleGenerateRandom = () => { 
      const generated: MathQuestion[] = [];
      const ops: string[] = [];
      if (randomConfig.operators.add) ops.push('+');
      if (randomConfig.operators.sub) ops.push('-');
      if (randomConfig.operators.mul) ops.push('×');
      if (randomConfig.operators.div) ops.push('÷');

      if (ops.length === 0) { alert('กรุณาเลือกเครื่องหมายอย่างน้อย 1 อย่าง'); return; }
      
      const count = questionSettingMode === 'CLASSROOM' ? 10 : randomConfig.count; 
      
      for(let i=0; i < count; i++) { 
          const op = ops[Math.floor(Math.random() * ops.length)];
          let a = Math.floor(Math.random() * (randomConfig.max - randomConfig.min + 1)) + randomConfig.min;
          let b = Math.floor(Math.random() * (randomConfig.max - randomConfig.min + 1)) + randomConfig.min;
          
          let qStr = '', ans = 0;
          if (op === '+') { ans = a + b; qStr = `${a} + ${b}`; }
          else if (op === '-') { if (a < b) [a, b] = [b, a]; ans = a - b; qStr = `${a} - ${b}`; }
          else if (op === '×') { ans = a * b; qStr = `${a} × ${b}`; }
          else if (op === '÷') { ans = a; a = a * b; qStr = `${a} ÷ ${b}`; }

          const options = new Set<number>([ans]);
          while(options.size < 4) {
              const fake = ans + (Math.floor(Math.random() * 11) - 5);
              if (fake >= 0 && fake !== ans) options.add(fake);
          }
          generated.push({ id: Date.now() + '_' + i, question: qStr, answer: ans, options: Array.from(options).sort(() => Math.random() - 0.5) });
      } 
      setGeneratedQuestions(generated); 
  };

  const handleAddCustom = () => {
    if (!newCustomQ.q || newCustomQ.opts.some(o => o === '')) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    const ans = parseInt(newCustomQ.opts[newCustomQ.correctIdx]);
    const opts = newCustomQ.opts.map(o => parseInt(o));
    const newQ = { id: Date.now().toString(), question: newCustomQ.q, answer: ans, options: opts };
    
    if (questionSettingMode === 'CLASSROOM' && generatedQuestions.length >= 10) {
        if(confirm("โหมดหรรษาต้องมี 10 ข้อ ต้องการเขียนทับข้อเดิมหรือไม่?")) setGeneratedQuestions([...generatedQuestions.slice(0, 9), newQ]);
    } else { 
        setGeneratedQuestions([...generatedQuestions, newQ]); 
        setNewCustomQ({ q: '', opts: ['', '', '', ''], correctIdx: 0 }); 
    }
  };

  const handleSaveQuestions = async () => {
    try {
        if (questionSettingMode === 'CLASSROOM') {
            if (generatedQuestions.length !== 10) { alert('โหมดห้องเรียนหรรษาต้องมีครบ 10 ข้อครับ'); return; }
            await StorageService.saveDailyQuestions(generatedQuestions);
        } else { 
            await StorageService.saveFreeplayQuestions(generatedQuestions);
        }
        alert('บันทึกโจทย์สำเร็จแล้วครับ!'); loadDataFromLocal();
    } catch (error) { alert('เกิดข้อผิดพลาดในการบันทึก'); }
  };

  const handleSaveAssets = () => {
      try {
          const playlist = bgmInput.split('\n').map(s => s.trim()).filter(s => s !== '');
          
          const convertedBackgrounds = { ...gameConfig.themeBackgrounds };
          Object.keys(convertedBackgrounds).forEach(key => {
              convertedBackgrounds[key] = getDirectImageLink(convertedBackgrounds[key]);
          });

          const newConfig = {
              themeBackgrounds: convertedBackgrounds,
              bgmPlaylist: playlist
          };

          StorageService.saveGameConfig(newConfig);
          setGameConfig(prev => ({ ...prev, themeBackgrounds: convertedBackgrounds }));
          
          alert('บันทึกการตั้งค่าเรียบร้อยแล้วครับ!');
      } catch (error) {
          alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.id || !studentForm.firstName) return;
    if (isEditingStudent && editingStudentId) StorageService.updateStudent(editingStudentId, { ...studentForm }); 
    else StorageService.registerStudent(studentForm.id, studentForm.firstName, studentForm.lastName, studentForm.nickname, studentForm.gender, studentForm.classroom, studentForm.profileImage || '');
    setStudentForm({ id: '', firstName: '', lastName: '', nickname: '', gender: 'MALE', classroom: '', profileImage: '', base: 'BOY' as CharacterBase, skinColor: '#fcd34d' as SkinColor });
    setIsEditingStudent(false); loadDataFromLocal();
  };

  const handleEditStudentClick = (s: StudentProfile) => {
      setStudentForm({ id: s.id, firstName: s.firstName, lastName: s.lastName, nickname: s.nickname, gender: s.gender, classroom: s.classroom, profileImage: s.profileImage || '', base: s.appearance?.base || 'BOY', skinColor: s.appearance?.skinColor || '#fcd34d' });
      setIsEditingStudent(true); setEditingStudentId(s.id); setActiveTab('STUDENTS');
  };

  // --- [ส่วนที่แก้ไข] ฟังก์ชันจัดการการลบ 2 แบบ (นักเรียน / คะแนน) ---
  
  // 1. กดลบนักเรียน
  const handleClickDeleteStudent = (s: StudentProfile) => {
      setDeleteType('STUDENT');
      setStudentToDelete(s);
      setDeleteStep('CONFIRM');
      setDeletePassword('');
      setShowDeleteModal(true);
  };

  // 2. กดลบคะแนน
  const handleClickDeleteSession = (sid: string, sessId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // หยุดไม่ให้ไปกดโดน Dropdown
      setDeleteType('SESSION');
      setSessionToDelete({ sid, sessId });
      setDeleteStep('CONFIRM');
      setDeletePassword('');
      setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
      setDeleteStep('PASSWORD');
  };

  const handleFinalDelete = () => {
      if (deletePassword === 'admin') {
          if (deleteType === 'STUDENT' && studentToDelete) {
              // ลบนักเรียน
              StorageService.deleteStudent(studentToDelete.id);
              // รีเซ็ตค่าหากลบคนที่เลือกอยู่
              if (selectedStudent?.id === studentToDelete.id) setSelectedStudent(null);
          } else if (deleteType === 'SESSION' && sessionToDelete) {
              // ลบคะแนน
              StorageService.deleteSession(sessionToDelete.sid, sessionToDelete.sessId);
              // อัปเดต selectedStudent เพื่อให้หน้าจอรีเฟรชคะแนนทันที
              if (selectedStudent) {
                  const updatedStudent = StorageService.getStudent(selectedStudent.id);
                  if (updatedStudent) setSelectedStudent(updatedStudent);
              }
          }
          
          loadDataFromLocal();
          setShowDeleteModal(false);
          setStudentToDelete(null);
          setSessionToDelete(null);
          setDeletePassword('');
      } else {
          alert('รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่');
      }
  };
  // -----------------------------------------------------------

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans overflow-hidden">
       {/* Modal ยืนยันการลบ (ใช้ร่วมกันทั้งลบนักเรียนและลบคะแนน) */}
       {showDeleteModal && (
           <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-pop-in">
               <div className="bg-slate-800 p-8 rounded-2xl border-4 border-red-500/50 shadow-2xl max-w-md w-full mx-4 text-center">
                   {deleteStep === 'CONFIRM' ? (
                       <>
                           <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                               <AlertTriangle size={40} className="text-red-500" />
                           </div>
                           <h2 className="text-2xl font-bold text-white mb-2">ต้องการลบจริงใช่ไหม?</h2>
                           <p className="text-slate-300 mb-6">
                               {deleteType === 'STUDENT' ? (
                                   <>ข้อมูลของ <span className="text-red-400 font-bold text-lg">{studentToDelete?.firstName}</span> จะหายไปทั้งหมด<br/>และไม่สามารถกู้คืนได้</>
                               ) : (
                                   <>ประวัติการเล่นรอบนี้จะถูกลบถาวร<br/>และไม่สามารถกู้คืนได้</>
                               )}
                           </p>
                           <div className="flex gap-4">
                               <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition">ยกเลิก</button>
                               <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition transform active:scale-95">ยืนยันการลบ</button>
                           </div>
                       </>
                   ) : (
                       <>
                           <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                               <Lock size={40} className="text-blue-500" />
                           </div>
                           <h2 className="text-xl font-bold text-white mb-4">ใส่รหัสผ่านครูเพื่อยืนยัน</h2>
                           <input 
                                type="password" 
                                autoFocus
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFinalDelete()}
                                placeholder="รหัสผ่าน..."
                                className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl p-3 text-center text-xl text-white mb-6 focus:border-blue-500 outline-none"
                           />
                           <div className="flex gap-4">
                               <button onClick={() => setDeleteStep('CONFIRM')} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition">ย้อนกลับ</button>
                               <button onClick={handleFinalDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition transform active:scale-95">ตกลงลบข้อมูล</button>
                           </div>
                       </>
                   )}
               </div>
           </div>
       )}

       <header className="flex-none bg-slate-800 p-4 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 z-10">
          <div className="flex justify-between items-center w-full md:w-auto">
              <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">ระบบจัดการคุณครู</h1>
              <button onClick={onLogout} className="md:hidden text-red-400 hover:text-white flex items-center gap-2 px-3 py-1 rounded-lg border border-red-900/30 transition-all hover:bg-red-900/20 bg-slate-900/50">
                  <LogOut size={18}/> <span className="text-sm font-bold">ออก</span>
              </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scrollbar">
             <button onClick={() => setActiveTab('REPORTS')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition flex-shrink-0 ${activeTab === 'REPORTS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>ผลการเรียน</button>
             <button onClick={() => setActiveTab('QUESTIONS')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition flex-shrink-0 ${activeTab === 'QUESTIONS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>จัดการโจทย์</button>
             <button onClick={() => setActiveTab('ASSETS')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition flex-shrink-0 ${activeTab === 'ASSETS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>ตั้งค่าเกม</button>
             <button onClick={() => setActiveTab('STUDENTS')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition flex-shrink-0 ${activeTab === 'STUDENTS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>รายชื่อนักเรียน</button>
             <button onClick={onLogout} className="hidden md:flex text-red-400 hover:text-white items-center gap-2 px-3 py-1 rounded-lg border border-red-900/30 transition-all hover:bg-red-900/20 whitespace-nowrap ml-auto">
                <LogOut size={18}/> ออก
             </button>
          </div>
       </header>

       <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
       
       {activeTab === 'QUESTIONS' && (
           <div className="max-w-6xl mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700 animate-pop-in">
               <div className="flex justify-center gap-4 mb-6 bg-slate-900/50 p-2 rounded-xl w-fit mx-auto">
                   <button onClick={() => setQuestionSettingMode('CLASSROOM')} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition ${questionSettingMode==='CLASSROOM' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400'}`}><Star/> ห้องเรียนหรรษา</button>
                   <button onClick={() => setQuestionSettingMode('FREEPLAY')} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition ${questionSettingMode==='FREEPLAY' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400'}`}><Gamepad2/> เล่นตามใจ</button>
               </div>
               <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                   <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Calendar/> {questionSettingMode === 'CLASSROOM' ? 'โจทย์ประจำวัน (บังคับ 10 ข้อ)' : 'คลังโจทย์หลัก (สุ่มมาเล่น)'}</h2>
                   <button onClick={handleSaveQuestions} className="bg-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-500 shadow-lg flex items-center gap-2 transition-all active:scale-95"><Save/> บันทึกโจทย์</button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                       <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600">
                           <h3 className="font-bold text-lg text-slate-300 mb-4 border-b border-slate-700 pb-2">1. สุ่มโจทย์อัตโนมัติ</h3>
                           <div className="grid grid-cols-2 gap-4 mb-4">
                               <div className="flex-1"><label className="block text-xs text-slate-400 mb-1">เลขต่ำสุด-สูงสุด</label>
                                 <div className="flex gap-2">
                                     <input type="number" value={randomConfig.min} onChange={e=>setRandomConfig({...randomConfig, min: parseInt(e.target.value)})} className="bg-slate-800 w-1/2 p-2 rounded border border-slate-500 text-center"/>
                                     <input type="number" value={randomConfig.max} onChange={e=>setRandomConfig({...randomConfig, max: parseInt(e.target.value)})} className="bg-slate-800 w-1/2 p-2 rounded border border-slate-500 text-center"/>
                                 </div>
                               </div>
                               {questionSettingMode === 'FREEPLAY' && (
                                 <div><label className="block text-xs text-slate-400 mb-1">จำนวนข้อในคลัง</label><input type="number" value={randomConfig.count} onChange={e=>setRandomConfig({...randomConfig, count: parseInt(e.target.value)})} className="bg-slate-800 w-full p-2 rounded border border-slate-500 text-center"/></div>
                               )}
                           </div>
                           <div className="mb-4">
                               <label className="block text-xs text-slate-400 mb-2 font-bold">เลือกเครื่องหมาย</label>
                               <div className="grid grid-cols-4 gap-2">
                                   {['add', 'sub', 'mul', 'div'].map(op => (
                                       <button key={op} onClick={() => setRandomConfig({...randomConfig, operators:{...randomConfig.operators, [op as keyof typeof randomConfig.operators]: !randomConfig.operators[op as keyof typeof randomConfig.operators]}})} className={`py-2 rounded-lg font-bold border-2 transition-all ${randomConfig.operators[op as keyof typeof randomConfig.operators] ? 'bg-blue-600 border-blue-400 text-white shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                           {op === 'add' ? '+' : op === 'sub' ? '-' : op === 'mul' ? '×' : '÷'}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <button onClick={handleGenerateRandom} className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 flex justify-center gap-2 items-center"><Shuffle size={20}/> สุ่มโจทย์ใหม่</button>
                       </div>
   
                       <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600">
                           <h3 className="font-bold text-lg text-slate-300 mb-3">2. ตั้งโจทย์เอง (4 ตัวเลือก)</h3>
                           <input placeholder="โจทย์ (เช่น 25 + 14)" value={newCustomQ.q} onChange={e=>setNewCustomQ({...newCustomQ, q: e.target.value})} className="w-full bg-slate-800 p-3 rounded-xl border border-slate-500 mb-4 focus:border-pink-500 outline-none"/>
                           <label className="block text-xs text-slate-400 mb-2">* ติ๊กวงกลมหน้าคำตอบที่ถูกต้อง</label>
                           <div className="grid grid-cols-2 gap-3 mb-4">
                               {newCustomQ.opts.map((opt, idx) => (
                                   <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border transition ${newCustomQ.correctIdx === idx ? 'border-green-500 bg-green-500/10' : 'border-slate-600'}`}>
                                       <input type="radio" name="correctQ" checked={newCustomQ.correctIdx === idx} onChange={() => setNewCustomQ({...newCustomQ, correctIdx: idx})} className="w-4 h-4 accent-green-500 cursor-pointer"/>
                                       <input placeholder={`ตัวเลือกที่ ${idx+1}`} value={opt} onChange={e => { const n = [...newCustomQ.opts]; n[idx] = e.target.value; setNewCustomQ({...newCustomQ, opts: n}); }} className="bg-transparent w-full outline-none text-sm"/>
                                   </div>
                               ))}
                           </div>
                           <button onClick={handleAddCustom} className="w-full bg-pink-600 py-3 rounded-xl font-bold hover:bg-pink-500 flex justify-center gap-2 items-center"><PlusCircle size={20}/> เพิ่มโจทย์ลงรายการ</button>
                       </div>
                   </div>
               
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600 h-[650px] flex flex-col shadow-inner">
                       <h3 className="font-bold text-lg text-slate-300 mb-2 text-center border-b border-slate-700 pb-2 flex justify-between items-center">
                           <span>รายการโจทย์ ({generatedQuestions.length} ข้อ)</span>
                           <button onClick={() => setGeneratedQuestions([])} className="text-xs text-red-400 hover:underline">ล้างทั้งหมด</button>
                       </h3>
                       <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                           {generatedQuestions.length === 0 ? (
                               <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50"><Gamepad2 size={48} className="mb-2"/><p>ยังไม่มีโจทย์</p></div>
                           ) : (
                               generatedQuestions.map((q, i) => (
                                   <div key={q.id || i} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 group hover:border-blue-500/50 transition">
                                       <div><span className="text-slate-500 font-mono mr-3">#{i+1}</span><span className="text-lg font-bold">{q.question}</span></div>
                                       <div className="flex items-center gap-4">
                                           <span className="text-green-400 font-black text-xl">= {q.answer}</span>
                                           <button onClick={() => setGeneratedQuestions(generatedQuestions.filter((_, idx) => idx !== i))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                                       </div>
                                   </div>
                               ))
                           )}
                       </div>
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'ASSETS' && (
           <div className="max-w-6xl mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 animate-pop-in">
               <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-bold flex items-center gap-2"><Palette/> ตั้งค่าฉากและเสียง</h2>
                   <button onClick={handleSaveAssets} className="bg-green-600 px-6 py-2 rounded-xl font-bold hover:bg-green-500 shadow-lg flex items-center gap-2 transition-all active:scale-95"><Save/> บันทึกการตั้งค่า</button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-4">
                       <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2 mb-4"><HardDrive/> ภาพพื้นหลังฉากต่างๆ</h3>
                       <div className="grid grid-cols-1 gap-4 max-h-[550px] overflow-y-auto pr-3 custom-scrollbar">
                           {THEME_IDS.map((theme) => (
                               <div key={theme.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-600 hover:border-blue-500/50 transition">
                                   <label className="block text-sm font-bold text-blue-300 mb-2">{theme.label}</label>
                                   <div className="flex gap-3">
                                       <input type="text" placeholder="URL รูปภาพ (รองรับ Google Drive)" value={gameConfig.themeBackgrounds[theme.id] || ''} onChange={e => setGameConfig({...gameConfig, themeBackgrounds:{...gameConfig.themeBackgrounds, [theme.id]: e.target.value}})} className="flex-1 bg-slate-800 p-3 rounded-lg border border-slate-500 text-white text-sm outline-none focus:border-blue-400 transition-all"/>
                                       {gameConfig.themeBackgrounds[theme.id] && (
                                           <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-500 shrink-0 bg-black shadow-lg">
                                                <img src={getDirectImageLink(gameConfig.themeBackgrounds[theme.id])} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                           </div>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-600 sticky top-0 h-fit shadow-2xl">
                       <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2 mb-4"><Music/> รายการเพลงประกอบ (BGM)</h3>
                       <textarea value={bgmInput} onChange={e => setBgmInput(e.target.value)} placeholder={`วาง URL เพลงบรรทัดละ 1 เพลง`} className="w-full bg-slate-800 p-4 rounded-xl border border-slate-500 text-white focus:border-green-500 outline-none mb-4 h-80 font-mono text-sm shadow-inner" />
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'STUDENTS' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full animate-pop-in">
               <div className="md:col-span-1 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-xl">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">{isEditingStudent ? <><Edit3/> แก้ไขนักเรียน</> : <><UserPlus/> เพิ่มนักเรียนใหม่</>}</h2>
                  <form onSubmit={handleSaveStudent} className="space-y-4">
                      <input type="text" placeholder="เลขที่ (เช่น 01)" value={studentForm.id} onChange={e=>setStudentForm({...studentForm, id:e.target.value})} className="w-full bg-slate-700 p-3 rounded-xl border border-slate-600 text-white font-bold focus:border-blue-500 outline-none"/>
                      <div className="flex gap-2"><input type="text" placeholder="ชื่อจริง" value={studentForm.firstName} onChange={e=>setStudentForm({...studentForm, firstName:e.target.value})} className="w-full bg-slate-700 p-3 rounded-xl border border-slate-600 focus:border-blue-500 outline-none"/><input type="text" placeholder="นามสกุล" value={studentForm.lastName} onChange={e=>setStudentForm({...studentForm, lastName:e.target.value})} className="w-full bg-slate-700 p-3 rounded-xl border border-slate-600 focus:border-blue-500 outline-none"/></div>
                      <div className="flex gap-2"><input type="text" placeholder="ชื่อเล่น" value={studentForm.nickname} onChange={e=>setStudentForm({...studentForm, nickname:e.target.value})} className="w-full bg-slate-700 p-3 rounded-xl border border-slate-600 focus:border-blue-500 outline-none"/><input type="text" placeholder="ชั้น/ห้อง" value={studentForm.classroom} onChange={e=>setStudentForm({...studentForm, classroom:e.target.value})} className="w-full bg-slate-700 p-3 rounded-xl border border-slate-600 focus:border-blue-500 outline-none"/></div>
                      <div className="flex gap-3">
                        <input type="text" placeholder="ลิงก์รูปประจำตัว" value={studentForm.profileImage} onChange={e=>setStudentForm({...studentForm, profileImage:e.target.value})} className="flex-1 bg-slate-700 p-3 rounded-xl border border-slate-600 focus:border-blue-500 outline-none"/>
                        {studentForm.profileImage && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-600 shrink-0 bg-white">
                                <img src={studentForm.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                        )}
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-600 text-center"><label className="block text-sm text-slate-300 mb-3 font-bold uppercase">เพศ</label><div className="flex gap-2"><button type="button" onClick={()=>setStudentForm({...studentForm, gender:'MALE'})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${studentForm.gender==='MALE'?'bg-blue-600 shadow-lg text-white':'bg-slate-700 text-slate-400'}`}>ชาย</button><button type="button" onClick={()=>setStudentForm({...studentForm, gender:'FEMALE'})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${studentForm.gender==='FEMALE'?'bg-pink-600 shadow-lg text-white':'bg-slate-700 text-slate-400'}`}>หญิง</button></div></div>
                      <button type="submit" className="w-full bg-green-600 py-4 rounded-xl font-black text-xl hover:bg-green-500 shadow-lg transition-all">บันทึกข้อมูล</button>
                  </form>
               </div>
               <div className="md:col-span-2 flex flex-col gap-4 h-full">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Users /> รายชื่อนักเรียน ({students.length})</h2>
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {students.map(s => (
                      <div key={s.id} className="bg-slate-700/50 p-4 rounded-xl flex justify-between items-center group hover:bg-slate-700 transition border border-transparent hover:border-blue-500/30">
                        <div className="flex items-center gap-4">
                          {s.profileImage ? (
                            <img src={s.profileImage} alt={s.firstName} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" referrerPolicy="no-referrer" />
                          ) : (
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white border-2 border-white shadow-md ${s.gender==='MALE' ? 'bg-blue-600' : 'bg-pink-600'}`}>{s.id}</div>
                          )}
                          <div><div className="font-bold text-lg">{s.firstName} {s.lastName} ({s.nickname})</div><div className="text-xs text-slate-400 uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded-full w-fit mt-1 border border-slate-600">ห้อง {s.classroom}</div></div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditStudentClick(s)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 p-2.5 rounded-xl transition-all shadow-sm"><Edit3 size={20}/></button>
                            {/* ปุ่มลบนักเรียน เรียกใช้ฟังก์ชัน handleClickDeleteStudent */}
                            <button onClick={() => handleClickDeleteStudent(s)} className="bg-red-600/20 text-red-400 hover:bg-red-600 p-2.5 rounded-xl transition-all shadow-sm"><Trash2 size={20}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
           </div>
       )}

       {activeTab === 'REPORTS' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full animate-pop-in">
               <div className="md:col-span-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[600px]">
                  <div className="p-4 bg-slate-700 font-bold text-slate-300 flex items-center gap-2"><Users size={20}/> รายชื่อนักเรียน</div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {students.map(s => (
                      <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 rounded-xl cursor-pointer flex justify-between items-center transition ${selectedStudent?.id === s.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700/50 hover:bg-slate-600'}`}>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-600 border border-white/20">
                             {s.profileImage ? (<img src={s.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />) : (<div className="w-full h-full flex items-center justify-center text-[10px]">{s.id}</div>)}
                           </div>
                           <div><span className="font-bold">No.{s.id}</span> {s.firstName}</div>
                        </div>
                        <ChevronRight size={16} />
                      </div>
                    ))}
                  </div>
               </div>
               <div className="md:col-span-2 bg-slate-900/50 rounded-xl border border-slate-700 p-6 h-[600px] overflow-y-auto relative">
                  {selectedStudent ? (
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-700 pb-4">
                         <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-400"><CheckCircle2/> ผลการเรียน: {selectedStudent.firstName}</h2>
                         <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                            <button onClick={() => setReportMode('CLASSROOM')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${reportMode==='CLASSROOM' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500'}`}><Star size={16}/> หรรษา</button>
                            <button onClick={() => setReportMode('FREEPLAY')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${reportMode==='FREEPLAY' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500'}`}><Gamepad2 size={16}/> ตามใจ</button>
                         </div>
                      </div>
                      <div className="space-y-6">
                        {selectedStudent.sessions && selectedStudent.sessions.filter(s => s.mode === reportMode).length > 0 ? (
                          selectedStudent.sessions.filter(s => s.mode === reportMode).slice().reverse().map((sess, idx) => (
                            <div key={idx} className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden shadow-lg transition hover:border-blue-500/30">
                               {/* ส่วนหัวข้อเป็นปุ่มกด Dropdown */}
                               <div className="bg-slate-700/50 p-4 flex justify-between items-center border-b border-slate-700 cursor-pointer" onClick={() => toggleSessionDetails(sess.sessionId)}>
                                  <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-300">
                                     <span className="flex items-center gap-1.5"><Calendar size={16}/> {sess.date}</span>
                                     <span className="flex items-center gap-1.5"><Clock size={16}/> {new Date(sess.timestamp).toLocaleTimeString('th-TH')}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <div className="text-right flex flex-col items-end gap-1">
                                        <div className="flex flex-wrap justify-end gap-2 text-[10px] md:text-[11px] font-bold">
                                           <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">คะแนนจริง {sess.realScore || 0}</span>
                                           <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">คะแนนสมบัติ {sess.bonusScore || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                           <div className="text-3xl font-black text-white drop-shadow-md leading-none">{sess.score}</div>
                                           <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">ผลรวมครั้งนี้</div>
                                        </div>
                                     </div>
                                     {/* ปุ่มลูกศรแสดงสถานะเปิด/ปิด */}
                                     <div className="p-2 rounded-full bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                         {expandedSessions.has(sess.sessionId) ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                     </div>
                                     {/* ปุ่มลบคะแนน เรียกใช้ฟังก์ชัน handleClickDeleteSession */}
                                     <button 
                                        onClick={(e) => handleClickDeleteSession(selectedStudent.id, sess.sessionId, e)} 
                                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                                     >
                                         <Trash2 size={20}/>
                                     </button>
                                  </div>
                               </div>
                               
                               {/* ส่วนรายละเอียดโจทย์ (แสดงเฉพาะตอนกดเปิด) */}
                               {expandedSessions.has(sess.sessionId) && (
                                   <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/30 animate-pop-in">
                                      {sess.details?.map((d, dIdx) => (
                                        <div key={dIdx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center shadow-inner">
                                           <span className="text-base font-bold font-mono text-slate-200">{d.questionText}</span>
                                           <div className="flex items-center gap-2">
                                              {d.isCorrect ? <CheckCircle2 size={18} className="text-green-400"/> : <XCircle size={18} className="text-red-400"/>}
                                              <span className="text-[10px] text-slate-500">+{d.scoreEarned}</span>
                                           </div>
                                        </div>
                                      ))}
                                   </div>
                               )}
                            </div>
                          ))
                        ) : ( <div className="text-center py-20 text-slate-600 italic">ยังไม่มีประวัติการเล่นในโหมดนี้</div> )}
                      </div>
                    </div>
                  ) : ( <div className="text-slate-500 text-center mt-20 text-xl font-bold flex flex-col items-center gap-4"><BarChart size={60} className="opacity-10"/> เลือกนักเรียนทางซ้ายเพื่อดูผลการเรียน</div> )}
               </div>
           </div>
       )}
       </div>
    </div>
  );
};