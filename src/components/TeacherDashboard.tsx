import React, { useState, useEffect } from 'react';
import type { StudentProfile, MathQuestion, GameConfig } from '../types';
import { StorageService } from '../services/storage';
import { Users, BookOpen, Settings, LogOut, Plus, Trash2, Save, Image as ImageIcon, Music, Layout, Trophy, BarChart } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'QUESTIONS' | 'SETTINGS' | 'SUMMARY'>('STUDENTS');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  
  // State สำหรับจัดการโจทย์
  const [questionMode, setQuestionMode] = useState<'CLASSROOM' | 'FREEPLAY'>('CLASSROOM');
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  
  // State สำหรับ Config
  const [config, setConfig] = useState<GameConfig>({
      schoolName: '', educationYear: '', bgmPlaylist: [], themeBackgrounds: {}
  });

  // State สำหรับ Form เพิ่มนักเรียน
  const [newStudent, setNewStudent] = useState<Partial<StudentProfile>>({ gender: 'MALE', character: 'BOY' });
  
  // State สำหรับ Form เพิ่มโจทย์
  const [newQ, setNewQ] = useState({ q: '', a: '', diff: 1 });

  useEffect(() => {
    loadData();
  }, [activeTab, questionMode]);

  const loadData = () => {
    setStudents(StorageService.getStudents());
    const allQ = StorageService.getAllQuestions();
    setQuestions(questionMode === 'CLASSROOM' ? allQ.classroom : allQ.freeplay);
    setConfig(StorageService.getGameConfig());
  };

  // --- Logic นักเรียน ---
  const handleAddStudent = () => {
    if (!newStudent.id || !newStudent.firstName) return alert('กรุณากรอกข้อมูลให้ครบ');
    const student: StudentProfile = {
      id: newStudent.id,
      firstName: newStudent.firstName,
      nickname: newStudent.nickname || '',
      gender: newStudent.gender as any,
      character: newStudent.gender === 'MALE' ? 'BOY' : 'GIRL',
      classroom: newStudent.classroom || '',
      score: 0, position: 0, calculatorUsesLeft: 3, isFinished: false,
      profileImage: newStudent.profileImage // บันทึกรูปภาพ
    };
    StorageService.saveStudent(student);
    setNewStudent({ gender: 'MALE', character: 'BOY' });
    loadData();
  };

  // --- Logic โจทย์ ---
  const handleAddQuestion = () => {
      if (!newQ.q || !newQ.a) return;
      const newQuestion: MathQuestion = {
          id: Date.now().toString(),
          question: newQ.q,
          answer: parseInt(newQ.a),
          type: 'ADD', // Default
          difficulty: newQ.diff
      };
      const currentList = [...questions, newQuestion];
      StorageService.saveQuestions(currentList, questionMode);
      setQuestions(currentList);
      setNewQ({ q: '', a: '', diff: 1 });
  };

  const handleDeleteQuestion = (id: string) => {
      const newList = questions.filter(q => q.id !== id);
      StorageService.saveQuestions(newList, questionMode);
      setQuestions(newList);
  };

  // --- Logic Settings ---
  const handleSaveConfig = () => {
      StorageService.saveGameConfig(config);
      alert('บันทึกการตั้งค่าเรียบร้อย');
  };

  const handleAddMusic = () => {
      const url = prompt("กรุณาใส่ลิงก์เพลง (mp3/youtube):");
      if (url) {
          setConfig(prev => ({ ...prev, bgmPlaylist: [...prev.bgmPlaylist, url] }));
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Settings size={24} /></div>
            <div>
                <h1 className="text-xl font-bold">ระบบจัดการครู</h1>
                <p className="text-xs text-slate-400">{config.schoolName || 'ยินดีต้อนรับ'}</p>
            </div>
        </div>
        <button onClick={onLogout} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition flex items-center gap-2">
            <LogOut size={18} /> ออกจากระบบ
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 bg-slate-800/50 p-4 space-y-2 border-r border-slate-700">
            <button onClick={() => setActiveTab('STUDENTS')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeTab === 'STUDENTS' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}><Users size={20} /> รายชื่อนักเรียน</button>
            <button onClick={() => setActiveTab('QUESTIONS')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeTab === 'QUESTIONS' ? 'bg-green-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}><BookOpen size={20} /> จัดการโจทย์</button>
            <button onClick={() => setActiveTab('SUMMARY')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeTab === 'SUMMARY' ? 'bg-amber-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}><BarChart size={20} /> สรุปคะแนน</button>
            <button onClick={() => setActiveTab('SETTINGS')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeTab === 'SETTINGS' ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-300'}`}><Layout size={20} /> ตั้งค่าเกม</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-900">
            
            {/* --- TAB: นักเรียน --- */}
            {activeTab === 'STUDENTS' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-blue-400"/> เพิ่มนักเรียนใหม่</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input placeholder="เลขที่ / ID" className="bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newStudent.id || ''} onChange={e => setNewStudent({...newStudent, id: e.target.value})} />
                            <input placeholder="ชื่อจริง" className="bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newStudent.firstName || ''} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} />
                            <input placeholder="ชื่อเล่น" className="bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newStudent.nickname || ''} onChange={e => setNewStudent({...newStudent, nickname: e.target.value})} />
                            <input placeholder="ห้องเรียน (เช่น ป.1/2)" className="bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newStudent.classroom || ''} onChange={e => setNewStudent({...newStudent, classroom: e.target.value})} />
                            <select className="bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value as any})}>
                                <option value="MALE">ชาย</option> <option value="FEMALE">หญิง</option>
                            </select>
                            <div className="flex gap-2">
                                <input placeholder="ลิ้งค์รูปโปรไฟล์ (ถ้ามี)" className="bg-slate-900 border border-slate-600 p-3 rounded-xl flex-1" value={newStudent.profileImage || ''} onChange={e => setNewStudent({...newStudent, profileImage: e.target.value})} />
                                {newStudent.profileImage && <img src={newStudent.profileImage} className="w-12 h-12 rounded-full object-cover border-2 border-white" />}
                            </div>
                        </div>
                        <button onClick={handleAddStudent} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold shadow-lg transition">บันทึกนักเรียน</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {students.map(s => (
                            <div key={s.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    {s.profileImage ? <img src={s.profileImage} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">🎓</div>}
                                    <div>
                                        <div className="font-bold text-lg">{s.firstName} <span className="text-sm text-slate-400">({s.nickname})</span></div>
                                        <div className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full inline-block">ห้อง {s.classroom}</div>
                                    </div>
                                </div>
                                <button onClick={() => { if(confirm('ลบ?')) { StorageService.deleteStudent(s.id); loadData(); } }} className="text-red-400 hover:bg-red-400/20 p-2 rounded-lg"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB: โจทย์ --- */}
            {activeTab === 'QUESTIONS' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 mb-6">
                        <button onClick={() => setQuestionMode('CLASSROOM')} className={`flex-1 py-2 rounded-lg font-bold transition ${questionMode === 'CLASSROOM' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}>ห้องเรียนหรรษา (เก็บคะแนน)</button>
                        <button onClick={() => setQuestionMode('FREEPLAY')} className={`flex-1 py-2 rounded-lg font-bold transition ${questionMode === 'FREEPLAY' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>เล่นตามใจ (ฝึกฝน)</button>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">สร้างโจทย์ใหม่ ({questionMode === 'CLASSROOM' ? 'สำหรับวันนี้' : 'สุ่มทั่วไป'})</h2>
                        <div className="flex gap-4 mb-4">
                            <input placeholder="โจทย์ (เช่น 5 + 5)" className="flex-[2] bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newQ.q} onChange={e => setNewQ({...newQ, q: e.target.value})} />
                            <input placeholder="คำตอบ" type="number" className="flex-1 bg-slate-900 border border-slate-600 p-3 rounded-xl" value={newQ.a} onChange={e => setNewQ({...newQ, a: e.target.value})} />
                        </div>
                        <button onClick={handleAddQuestion} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold shadow-lg">เพิ่มโจทย์</button>
                    </div>

                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div className="text-xl font-mono font-bold text-slate-200"><span className="text-slate-500 mr-4">#{idx+1}</span> {q.question} = <span className="text-green-400">{q.answer}</span></div>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:bg-red-400/20 p-2 rounded-lg"><Trash2 size={20} /></button>
                            </div>
                        ))}
                        {questions.length === 0 && <div className="text-center text-slate-500 py-10">ยังไม่มีโจทย์ในหมวดนี้</div>}
                    </div>
                </div>
            )}

            {/* --- TAB: ตั้งค่า --- */}
            {activeTab === 'SETTINGS' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Layout /> ข้อมูลโรงเรียน</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ชื่อโรงเรียน</label>
                                <input className="w-full bg-slate-900 border border-slate-600 p-3 rounded-xl" value={config.schoolName} onChange={e => setConfig({...config, schoolName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ปีการศึกษา</label>
                                <input className="w-full bg-slate-900 border border-slate-600 p-3 rounded-xl" value={config.educationYear} onChange={e => setConfig({...config, educationYear: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Music /> เพลงประกอบ (Playlist)</h2>
                        <div className="space-y-2 mb-4">
                            {config.bgmPlaylist.map((url, i) => (
                                <div key={i} className="flex gap-2">
                                    <input className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded-lg text-xs" value={url} readOnly />
                                    <button onClick={() => setConfig({...config, bgmPlaylist: config.bgmPlaylist.filter((_, idx) => idx !== i)})} className="text-red-400"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddMusic} className="w-full border border-dashed border-slate-500 text-slate-400 py-3 rounded-xl hover:bg-slate-700 hover:text-white transition">+ เพิ่มลิงก์เพลง</button>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon /> พื้นหลังตามธีม (Custom Backgrounds)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['jungle', 'space', 'ocean', 'castle', 'candy', 'volcano'].map(theme => (
                                <div key={theme}>
                                    <label className="block text-xs uppercase text-slate-500 mb-1">{theme}</label>
                                    <input 
                                        placeholder={`ลิ้งค์รูปสำหรับ ${theme}`}
                                        className="w-full bg-slate-900 border border-slate-600 p-2 rounded-lg text-sm"
                                        value={config.themeBackgrounds[theme] || ''}
                                        onChange={e => setConfig({
                                            ...config, 
                                            themeBackgrounds: { ...config.themeBackgrounds, [theme]: e.target.value }
                                        })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleSaveConfig} className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"><Save /> บันทึกการตั้งค่าทั้งหมด</button>
                        <button onClick={() => { if(confirm('ล้างข้อมูลทั้งหมด?')) StorageService.resetFactory(); }} className="px-6 bg-red-600 hover:bg-red-500 rounded-2xl font-bold shadow-lg">Reset</button>
                    </div>
                </div>
            )}

            {/* --- TAB: สรุปคะแนน --- */}
            {activeTab === 'SUMMARY' && (
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ฝั่งซ้าย: คะแนนรวมรายคน */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                             <h2 className="text-xl font-bold mb-6 text-blue-400 flex items-center gap-2"><Trophy /> อันดับคะแนนรวม</h2>
                             <div className="space-y-4">
                                 {students.sort((a,b) => (b.score || 0) - (a.score || 0)).map((s, i) => (
                                     <div key={s.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-slate-400 text-black':i===2?'bg-orange-700 text-white':'bg-slate-800 text-slate-500'}`}>{i+1}</div>
                                             <div>
                                                 <div className="font-bold">{s.firstName}</div>
                                                 <div className="text-xs text-slate-500">ห้อง {s.classroom}</div>
                                             </div>
                                         </div>
                                         <div className="text-2xl font-black text-yellow-500">{s.score || 0}</div>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        {/* ฝั่งขวา: แยกตามโหมด */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <h2 className="text-xl font-bold mb-6 text-green-400 flex items-center gap-2"><BarChart /> สถิติการเล่น</h2>
                            <div className="h-64 flex items-center justify-center text-slate-500 italic">
                                (ส่วนนี้จะแสดงกราฟหรือรายละเอียดแยกโหมดในอนาคต)
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};