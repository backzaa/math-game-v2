import React, { useState, useEffect } from 'react';
import type { StudentProfile, MathQuestion } from '../types';
import { StorageService } from '../services/storage';
import { Download, Trash2, Plus, Save, X, Search, User, FileText, Settings, LogOut } from 'lucide-react';

interface Props {
  onExit: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'QUESTIONS' | 'SETTINGS'>('STUDENTS');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MathQuestion | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStudents(StorageService.getAllStudents());
    setQuestions(StorageService.getDailyQuestions() || []);
  };

  // --- ส่วนดาวน์โหลดข้อมูล (Export) ---
  const exportData = () => {
      const headers = ['ID,Name,Nickname,Classroom,TotalScore,LastPlayed'];
      const rows = students.map(s => {
          const name = s.firstName || '-'; 
          const lastPlay = s.sessions && s.sessions.length > 0 
            ? new Date(s.sessions[s.sessions.length-1].timestamp).toLocaleDateString('th-TH') 
            : '-';
          const totalScore = s.sessions 
            ? s.sessions.reduce((sum, sess) => sum + (sess.score || 0), 0)
            : 0;
          return `${s.id},${name},${s.nickname},${s.classroom || '-'},${totalScore},${lastPlay}`;
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "student_scores.csv");
      document.body.appendChild(link);
      link.click();
  };

  // --- ส่วนจัดการนักเรียน ---
  const handleAddStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const id = (form.elements.namedItem('sid') as HTMLInputElement).value;
      const fname = (form.elements.namedItem('fname') as HTMLInputElement).value;
      const nname = (form.elements.namedItem('nname') as HTMLInputElement).value;
      const room = (form.elements.namedItem('room') as HTMLInputElement).value;
      const gender = (form.elements.namedItem('gender') as HTMLSelectElement).value as any;

      await StorageService.registerStudent(id, fname, '', nname, gender, room, '');
      
      alert('เพิ่มนักเรียนเรียบร้อย');
      setShowAddStudent(false);
      loadData();
  };

  const handleDeleteStudent = (id: string) => {
      if(confirm('ยืนยันลบข้อมูลนักเรียน?')) {
          StorageService.deleteStudent(id);
          loadData();
      }
  };

  // --- ส่วนจัดการโจทย์ ---
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const qText = (form.elements.namedItem('question') as HTMLInputElement).value;
    const answer = parseInt((form.elements.namedItem('answer') as HTMLInputElement).value);
    
    const opt1 = parseInt((form.elements.namedItem('opt1') as HTMLInputElement).value);
    const opt2 = parseInt((form.elements.namedItem('opt2') as HTMLInputElement).value);
    const opt3 = parseInt((form.elements.namedItem('opt3') as HTMLInputElement).value);
    const opt4 = parseInt((form.elements.namedItem('opt4') as HTMLInputElement).value);

    const newQ: MathQuestion = {
        id: editingQuestion ? editingQuestion.id : Date.now().toString(),
        question: qText,
        answer: answer,
        type: 'ADD', 
        difficulty: 1,
        options: [opt1, opt2, opt3, opt4]
    };

    let updatedQuestions;
    if (editingQuestion) {
        updatedQuestions = questions.map(q => q.id === newQ.id ? newQ : q);
    } else {
        updatedQuestions = [...questions, newQ];
    }
    
    setQuestions(updatedQuestions);
    StorageService.saveDailyQuestions(updatedQuestions);
    setShowAddQuestion(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if(confirm('ลบโจทย์ข้อนี้?')) {
        const updated = questions.filter(q => q.id !== id);
        setQuestions(updated);
        StorageService.saveDailyQuestions(updated);
    }
  };

  const filteredStudents = students.filter(s => 
      (s.firstName || '').includes(searchTerm) || s.id.includes(searchTerm) || s.nickname.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-20">
      {/* Header */}
      <div className="bg-slate-800 p-4 sticky top-0 z-10 shadow-lg border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">ระบบจัดการครู</h1>
          <button onClick={onExit} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg border border-red-500/50 hover:bg-red-500 hover:text-white transition flex items-center gap-2">
              <LogOut size={18} /> ออกจากระบบ
          </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Menu Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('STUDENTS')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'STUDENTS' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>
                <User size={20}/> รายชื่อนักเรียน
            </button>
            <button onClick={() => setActiveTab('QUESTIONS')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'QUESTIONS' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>
                <FileText size={20}/> จัดการโจทย์
            </button>
            <button onClick={() => setActiveTab('SETTINGS')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'SETTINGS' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>
                <Settings size={20}/> ตั้งค่าเกม
            </button>
        </div>

        {/* --- Tab 1: นักเรียน --- */}
        {activeTab === 'STUDENTS' && (
            <div className="animate-fade-in">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="ค้นหาชื่อ, เลขที่..." className="w-full bg-slate-800 border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
                    </div>
                    {/* ปุ่ม Export CSV ใช้ Download icon */}
                    <button onClick={exportData} className="bg-green-600 hover:bg-green-500 px-4 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 justify-center">
                        <Download size={20}/> Export CSV
                    </button>
                    <button onClick={() => setShowAddStudent(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 justify-center">
                        <Plus size={20}/> เพิ่มนักเรียน
                    </button>
                </div>

                <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="p-4">เลขที่</th>
                                <th className="p-4">ชื่อ</th>
                                <th className="p-4 text-center">ห้อง</th>
                                <th className="p-4 text-center">คะแนนรวม</th>
                                <th className="p-4 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredStudents.map(s => (
                                <tr key={s.id} className="hover:bg-slate-700/50">
                                    <td className="p-4 font-mono text-blue-300">{s.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold">{s.firstName}</div>
                                        <div className="text-xs text-slate-500">({s.nickname})</div>
                                    </td>
                                    <td className="p-4 text-center"><span className="bg-slate-700 px-2 py-1 rounded text-xs">{s.classroom}</span></td>
                                    <td className="p-4 text-center text-green-400 font-bold">{s.sessions?.reduce((sum, sess) => sum + (sess.score || 0), 0) || 0}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDeleteStudent(s.id)} className="bg-red-500/10 text-red-400 p-2 rounded hover:bg-red-500 hover:text-white transition"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- Tab 2: โจทย์ --- */}
        {activeTab === 'QUESTIONS' && (
            <div className="animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-300">รายการโจทย์ ({questions.length})</h2>
                    <button onClick={() => { setEditingQuestion(null); setShowAddQuestion(true); }} className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                        <Plus size={20}/> สร้างโจทย์ใหม่
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {questions.map(q => (
                        <div key={q.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => { setEditingQuestion(q); setShowAddQuestion(true); }} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500 hover:text-white"><FileText size={16}/></button>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                            </div>
                            <div className="text-center py-4">
                                <div className="text-4xl font-black text-white mb-2">{q.question}</div>
                                <div className="inline-block bg-green-500/20 text-green-400 px-4 py-1 rounded-full font-bold border border-green-500/50">ตอบ: {q.answer}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- Tab 3: ตั้งค่าเกม --- */}
        {activeTab === 'SETTINGS' && (
            <div className="animate-fade-in bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="text-orange-500"/> ตั้งค่าระบบเกม</h2>
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">ข้อมูลโรงเรียน</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><label className="text-slate-400 text-sm">ชื่อโรงเรียน</label><input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" defaultValue="โรงเรียนบ้านหนองบัว" /></div>
                            <div><label className="text-slate-400 text-sm">ปีการศึกษา</label><input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" defaultValue="2567" /></div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">การจัดการข้อมูล</h3>
                        <button onClick={() => { if(confirm('ล้างข้อมูลทั้งหมด?')) { localStorage.clear(); window.location.reload(); } }} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold w-full md:w-auto">
                            ⚠️ ล้างข้อมูลระบบทั้งหมด (Reset Factory)
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Modal: เพิ่มนักเรียน */}
      {showAddStudent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-600 shadow-2xl relative">
                  {/* ปุ่มปิด X */}
                  <button onClick={() => setShowAddStudent(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button>
                  
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus size={24} className="text-blue-500"/> ลงทะเบียนนักเรียนใหม่</h3>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                      <input name="sid" placeholder="เลขที่" required className="w-full bg-slate-900 border-slate-600 rounded p-3 text-white"/>
                      <input name="fname" placeholder="ชื่อจริง" required className="w-full bg-slate-900 border-slate-600 rounded p-3 text-white"/>
                      <input name="nname" placeholder="ชื่อเล่น" required className="w-full bg-slate-900 border-slate-600 rounded p-3 text-white"/>
                      <div className="flex gap-2">
                        <input name="room" placeholder="ห้องเรียน" required className="flex-1 bg-slate-900 border-slate-600 rounded p-3 text-white"/>
                        <select name="gender" className="bg-slate-900 border-slate-600 rounded p-3 text-white">
                            <option value="MALE">ชาย</option>
                            <option value="FEMALE">หญิง</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 bg-slate-700 text-white py-3 rounded-xl">ยกเลิก</button>
                          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                             <Save size={18}/> บันทึก
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal: เพิ่มโจทย์ */}
      {showAddQuestion && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg border border-slate-600 shadow-2xl relative">
                  {/* ปุ่มปิด X */}
                  <button onClick={() => setShowAddQuestion(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button>

                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      {editingQuestion ? <FileText className="text-blue-500"/> : <Plus className="text-green-500"/>}
                      {editingQuestion ? 'แก้ไขโจทย์' : 'สร้างโจทย์ใหม่'}
                  </h3>
                  <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <div>
                          <label className="text-slate-400 text-sm">โจทย์ (เช่น 5 + 5)</label>
                          <input name="question" defaultValue={editingQuestion?.question} required className="w-full bg-slate-900 border-slate-600 rounded p-3 text-white text-center text-xl font-mono"/>
                      </div>
                      <div>
                          <label className="text-green-400 text-sm">คำตอบที่ถูกต้อง</label>
                          <input name="answer" type="number" defaultValue={editingQuestion?.answer} required className="w-full bg-green-900/20 border-green-500/50 rounded p-3 text-white text-center text-xl font-bold"/>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl">
                          <label className="text-slate-400 text-xs mb-2 block text-center">ตัวเลือก 4 ข้อ</label>
                          <div className="grid grid-cols-2 gap-2">
                              {[0,1,2,3].map(i => (
                                  <input key={i} name={`opt${i+1}`} type="number" defaultValue={editingQuestion?.options?.[i]} placeholder={`ตัวเลือก ${i+1}`} required className="bg-slate-800 border-slate-600 rounded p-2 text-center text-white"/>
                              ))}
                          </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={() => setShowAddQuestion(false)} className="flex-1 bg-slate-700 text-white py-3 rounded-xl">ยกเลิก</button>
                          <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                              <Save size={18}/> บันทึก
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};