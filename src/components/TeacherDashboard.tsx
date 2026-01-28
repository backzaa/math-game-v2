import React, { useState, useEffect } from 'react';
import type { StudentProfile, MathQuestion } from '../types';
import { StorageService } from '../services/storage';
import { Download, Trash2, Plus, Save, X, Search, User, FileText, PieChart, LogOut } from 'lucide-react';

interface Props {
  onExit: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'QUESTIONS'>('STUDENTS');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditingQ, setIsEditingQ] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MathQuestion | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // [แก้ไข] เปลี่ยนจาก getStudents เป็น getAllStudents ให้ตรงกับ StorageService
    const allStudents = StorageService.getAllStudents();
    setStudents(allStudents);
    
    const daily = StorageService.getDailyQuestions();
    setQuestions(daily || []);
  };

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
    setIsEditingQ(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if(confirm('ต้องการลบโจทย์ข้อนี้ใช่ไหม?')) {
        const updated = questions.filter(q => q.id !== id);
        setQuestions(updated);
        StorageService.saveDailyQuestions(updated);
    }
  };

  const handleDeleteStudent = (id: string) => {
      if(confirm('ลบข้อมูลนักเรียนคนนี้? (กู้คืนไม่ได้)')) {
          StorageService.deleteStudent(id);
          loadData();
      }
  };

  const exportData = () => {
      const headers = ['ID,Name,Nickname,Classroom,TotalScore,LastPlayed'];
      const rows = students.map(s => {
          const name = s.firstName || '-'; 
          const lastPlay = s.sessions && s.sessions.length > 0 
            ? new Date(s.sessions[s.sessions.length-1].timestamp).toLocaleDateString('th-TH') 
            : '-';
          
          const totalScore = s.sessions 
            ? s.sessions.filter(sess => sess.mode === 'CLASSROOM').reduce((sum, sess) => sum + (sess.score || 0), 0)
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

  const filteredStudents = students.filter(s => 
      (s.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.includes(searchTerm) ||
      s.nickname.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg"><PieChart className="text-white" /></div>
                <h1 className="text-xl md:text-2xl font-black text-white">ระบบจัดการครู</h1>
            </div>
            <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700">
                <LogOut size={18} /> ออกจากระบบ
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex gap-4 mb-8 border-b-2 border-slate-700/50 pb-1">
            <button onClick={() => setActiveTab('STUDENTS')} className={`pb-3 px-2 font-bold text-lg transition-all flex items-center gap-2 ${activeTab === 'STUDENTS' ? 'text-indigo-400 border-b-4 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <User size={20} /> รายชื่อ & คะแนน
            </button>
            <button onClick={() => setActiveTab('QUESTIONS')} className={`pb-3 px-2 font-bold text-lg transition-all flex items-center gap-2 ${activeTab === 'QUESTIONS' ? 'text-green-400 border-b-4 border-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <FileText size={20} /> จัดการโจทย์เลข
            </button>
        </div>

        {activeTab === 'STUDENTS' && (
            <div className="space-y-6 animate-slide-up">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="ค้นหา (ชื่อ, เลขที่, ชื่อเล่น)..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <button onClick={exportData} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                        <Download size={20} /> ดาวน์โหลด CSV
                    </button>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                                    <th className="p-4 font-bold">เลขที่</th>
                                    <th className="p-4 font-bold">ชื่อ - สกุล</th>
                                    <th className="p-4 font-bold text-center">ห้อง</th>
                                    <th className="p-4 font-bold text-center">คะแนนสะสม</th>
                                    <th className="p-4 font-bold text-center">เล่นล่าสุด</th>
                                    <th className="p-4 font-bold text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredStudents.length > 0 ? filteredStudents.map(s => {
                                    const totalScore = s.sessions ? s.sessions.filter(sess => sess.mode === 'CLASSROOM').reduce((sum, sess) => sum + (sess.score || 0), 0) : 0;
                                    const lastSession = s.sessions && s.sessions.length > 0 ? s.sessions[s.sessions.length - 1] : null;
                                    
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4 font-mono text-indigo-300 font-bold text-lg">{s.id}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-white">{s.firstName || '-'}</div>
                                                <div className="text-xs text-slate-500">({s.nickname})</div>
                                            </td>
                                            <td className="p-4 text-center"><span className="bg-slate-700 px-2 py-1 rounded text-xs">{s.classroom || '-'}</span></td>
                                            <td className="p-4 text-center">
                                                <span className="text-green-400 font-black text-lg">{totalScore}</span>
                                            </td>
                                            <td className="p-4 text-center text-sm text-slate-400">
                                                {lastSession ? new Date(lastSession.timestamp).toLocaleDateString('th-TH') : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleDeleteStudent(s.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">ไม่พบข้อมูลนักเรียน</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'QUESTIONS' && (
            <div className="space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">คลังโจทย์ประจำวัน</h2>
                    <button onClick={() => { setEditingQuestion(null); setIsEditingQ(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                        <Plus size={20} /> เพิ่มโจทย์ใหม่
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* [แก้ไข] ลบ idx ออก เพราะไม่ได้ใช้ */}
                    {questions.map((q) => (
                        <div key={q.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md hover:border-indigo-500 transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingQuestion(q); setIsEditingQ(true); }} className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white"><FileText size={16} /></button>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white"><Trash2 size={16} /></button>
                            </div>
                            <div className="text-xs text-slate-500 mb-2 font-mono">ID: {q.id}</div>
                            <div className="text-3xl font-black text-white mb-4 text-center py-4 bg-slate-900/50 rounded-xl">{q.question}</div>
                            <div className="flex justify-between items-center">
                                <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm font-bold border border-green-900">ตอบ: {q.answer}</span>
                                {q.options && <span className="text-xs text-slate-500">{q.options.length} ตัวเลือก</span>}
                            </div>
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <div className="col-span-full p-12 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
                            ยังไม่มีโจทย์ในระบบ กดปุ่ม "เพิ่มโจทย์ใหม่" เพื่อเริ่มสร้าง
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {isEditingQ && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl w-full max-w-lg overflow-hidden animate-pop-in">
                  <div className="bg-indigo-600 p-4 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {editingQuestion ? '✏️ แก้ไขโจทย์' : '✨ สร้างโจทย์ใหม่'}
                      </h3>
                      <button onClick={() => setIsEditingQ(false)} className="text-white/70 hover:text-white"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
                      <div>
                          <label className="block text-slate-400 text-sm mb-1">โจทย์สมการ</label>
                          <input name="question" type="text" defaultValue={editingQuestion?.question} placeholder="เช่น 5 + 3" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-xl font-mono text-center" />
                      </div>
                      <div>
                          <label className="block text-green-400 text-sm mb-1 font-bold">คำตอบที่ถูกต้อง</label>
                          <input name="answer" type="number" defaultValue={editingQuestion?.answer} placeholder="8" required className="w-full bg-green-900/20 border border-green-700/50 rounded-lg p-3 text-green-400 focus:border-green-500 outline-none text-xl font-bold text-center" />
                      </div>
                      
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                          <label className="block text-slate-400 text-xs mb-3 text-center uppercase tracking-widest">ตัวเลือกคำตอบ 4 ข้อ (รวมข้อถูกด้วย)</label>
                          <div className="grid grid-cols-2 gap-3">
                              <input name="opt1" type="number" defaultValue={editingQuestion?.options?.[0]} placeholder="ตัวเลือก 1" required className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white" />
                              <input name="opt2" type="number" defaultValue={editingQuestion?.options?.[1]} placeholder="ตัวเลือก 2" required className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white" />
                              <input name="opt3" type="number" defaultValue={editingQuestion?.options?.[2]} placeholder="ตัวเลือก 3" required className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white" />
                              <input name="opt4" type="number" defaultValue={editingQuestion?.options?.[3]} placeholder="ตัวเลือก 4" required className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white" />
                          </div>
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg mt-4 flex justify-center items-center gap-2">
                          <Save size={20} /> บันทึกโจทย์
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};