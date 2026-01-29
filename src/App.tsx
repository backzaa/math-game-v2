import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GameBoard } from './components/GameBoard';
import { StorageService } from './services/storage'; 
import type { UserRole, ThemeConfig, PlayerState, ScoringMode, QuestionDetail } from './types'; 
import { 
  Star, Gamepad2, CloudSync, 
  Plus, Divide,
  Smile, Backpack, BookOpen, Infinity, Pi, Lock, CheckCircle2, Shuffle
} from 'lucide-react';

const THEMES: ThemeConfig[] = [
  { id: 'jungle', name: 'ป่ามหาสนุก', bgClass: 'jungle', primaryColor: 'green', secondaryColor: 'orange', decorations: [], bgmUrls: [] },
  { id: 'space', name: 'ผจญภัยอวกาศ', bgClass: 'space', primaryColor: 'blue', secondaryColor: 'purple', decorations: [], bgmUrls: [] },
  { id: 'boat', name: 'ล่องเรือ', bgClass: 'boat', primaryColor: 'cyan', secondaryColor: 'yellow', decorations: [], bgmUrls: [] },
  { id: 'ocean', name: 'ดำน้ำ', bgClass: 'ocean', primaryColor: 'blue', secondaryColor: 'teal', decorations: [], bgmUrls: [] },
  { id: 'volcano', name: 'ภูเขาไฟ', bgClass: 'volcano', primaryColor: 'red', secondaryColor: 'orange', decorations: [], bgmUrls: [] },
  { id: 'candy', name: 'เมืองขนมหวาน', bgClass: 'candy', primaryColor: 'pink', secondaryColor: 'purple', decorations: [], bgmUrls: [] },
  { id: 'castle', name: 'ปราสาท', bgClass: 'castle', primaryColor: 'gray', secondaryColor: 'gold', decorations: [], bgmUrls: [] },
  { id: 'random', name: 'สุ่มดินแดน', bgClass: 'random', primaryColor: 'indigo', secondaryColor: 'rose', decorations: [], bgmUrls: [] },
];

export function App() {
  const [screen, setScreen] = useState<'LOADING' | 'LOGIN' | 'MODE_SELECT' | 'THEME_SELECT' | 'GAME' | 'DASHBOARD'>('LOADING');
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  
  // [เพิ่มใหม่] State เก็บรูป Avatar ผู้มาเยือน
  const [currentGuestAvatar, setCurrentGuestAvatar] = useState<string>('');

  const [gameMode, setGameMode] = useState<ScoringMode>('CLASSROOM');
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [gamePlayers, setGamePlayers] = useState<PlayerState[]>([]);
  const [sessionDetails, setSessionDetails] = useState<QuestionDetail[]>([]);
  
  const [themeBackgrounds, setThemeBackgrounds] = useState<Record<string, string>>({});

  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState('กำลังเตรียมตัวผจญภัย...');
  const isDataLoaded = useRef(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Mali:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    document.body.style.fontFamily = "'Mali', cursive";
  }, []);

  useEffect(() => {
    if (screen !== 'LOADING' || isDataLoaded.current) return;

    const startLoading = async () => {
      const timer = setInterval(() => {
        setLoadProgress(prev => {
           if (prev >= 80) return 80; 
           return prev + 1;
        });
      }, 50);

      try {
        setLoadStatus('กำลังดึงข้อมูลนักเรียนและโจทย์จาก Server...');
        await StorageService.syncFromCloud(); 
        
        const config = StorageService.getGameConfig();
        if (config && config.themeBackgrounds) {
            setThemeBackgrounds(config.themeBackgrounds);
        }

        clearInterval(timer);
        setLoadStatus('ข้อมูลพร้อมแล้ว! กำลังเข้าสู่ระบบ...');
        setLoadProgress(100);
        isDataLoaded.current = true;

        setTimeout(() => {
            setScreen('LOGIN');
        }, 800);

      } catch (error) { 
          console.error("Load failed", error);
          clearInterval(timer);
          setLoadProgress(100);
          setLoadStatus('โหลดไม่สมบูรณ์ (Offline Mode)');
          setTimeout(() => setScreen('LOGIN'), 1000);
      }
    };

    startLoading();
  }, [screen]);

  const hasPlayedClassroomToday = () => {
    if (!currentStudentId || currentStudentId === '00') return false; 
    const student = StorageService.getStudent(currentStudentId);
    if (!student || !student.sessions) return false;
    const today = new Date().toISOString().split('T')[0];
    return student.sessions.some(s => s.mode === 'CLASSROOM' && s.date === today);
  };

  // [แก้ไข] รับ avatar มาด้วย และบันทึก
  const handleLogin = (role: UserRole, id: string, guestNickname?: string, guestAvatar?: string) => {
    if (role === 'TEACHER') setScreen('DASHBOARD');
    else {
      setCurrentStudentId(id);
      if (id === '00' && guestNickname) {
          setGuestName(guestNickname);
          // เก็บค่ารูปภาพที่ส่งมาจาก LoginScreen
          if (guestAvatar) setCurrentGuestAvatar(guestAvatar);
      }
      setScreen('MODE_SELECT');
    }
  };

  // [ฟังก์ชันใหม่] แปลง Emoji เป็นรูปภาพ (SVG Data URL)
  const emojiToDataUrl = (emoji: string) => {
    // ปรับแต่งให้ Emoji อยู่กึ่งกลาง
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="55%" font-size="80" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  if (screen === 'LOADING') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
            <Plus className="absolute top-10 left-10 text-white w-16 h-16 animate-bounce-slow" />
            <Divide className="absolute bottom-20 left-10 text-white w-14 h-14 animate-spin-slow" />
            <Infinity className="absolute top-1/2 left-20 text-white w-20 h-20 animate-pulse" />
            <Pi className="absolute top-20 right-1/3 text-white w-16 h-16 animate-float" />
        </div>
        <div className="bg-white/20 backdrop-blur-xl p-10 rounded-[60px] border-[6px] border-white/40 shadow-2xl flex flex-col items-center max-w-sm w-full animate-pop-in z-10">
          <div className="flex gap-4 mb-8">
              <div className="bg-yellow-400 p-4 rounded-full shadow-lg border-4 border-white animate-bounce" style={{ animationDelay: '0s' }}><Smile className="text-white w-10 h-10" /></div>
              <div className="bg-blue-400 p-4 rounded-full shadow-lg border-4 border-white animate-bounce" style={{ animationDelay: '0.2s' }}><Backpack className="text-white w-10 h-10" /></div>
              <div className="bg-pink-400 p-4 rounded-full shadow-lg border-4 border-white animate-bounce" style={{ animationDelay: '0.4s' }}><BookOpen className="text-white w-10 h-10" /></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 py-2 text-center leading-relaxed">รอโหลดสักครู่นะครับ</h2>
          <div className={`flex items-center gap-2 font-bold mb-8 h-8 text-sm px-5 py-1 rounded-full border border-white/20 transition-all duration-500 ${loadProgress === 100 ? 'bg-green-500 text-white' : 'bg-indigo-900/30 text-indigo-50'}`}>
            {loadProgress === 100 ? <CheckCircle2 size={16}/> : <CloudSync size={16} className="animate-spin" />} 
            {loadStatus}
          </div>
          <div className="w-full bg-slate-900/40 h-8 rounded-full overflow-hidden border-4 border-white/30 p-1.5 mb-3 shadow-inner relative">
            <div className="h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]" style={{ width: `${loadProgress}%` }}></div>
          </div>
          <div className="text-white font-bold text-3xl">{loadProgress}%</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 overflow-hidden flex flex-col">
      {screen === 'LOGIN' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'DASHBOARD' && <TeacherDashboard onLogout={() => setScreen('LOGIN')} />}
      
      {screen === 'MODE_SELECT' && (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start md:justify-center p-4 py-10 md:p-8 bg-slate-900 text-white font-bold">
          <h1 className="text-2xl md:text-5xl font-black mb-8 md:mb-16 py-10 px-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 text-center drop-shadow-sm leading-[2.5]">
            คิดเลขสนุก BY ครูแบ็ค
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4">
            <button 
              disabled={hasPlayedClassroomToday()}
              onClick={() => { setGameMode('CLASSROOM'); setScreen('THEME_SELECT'); }} 
              className={`group relative p-8 md:p-12 rounded-[40px] border-4 transition-all shadow-2xl overflow-hidden ${hasPlayedClassroomToday() ? 'bg-slate-800/50 border-slate-700 opacity-60 grayscale cursor-not-allowed' : 'bg-slate-800 border-orange-500/30 hover:border-orange-400 hover:scale-105 active:scale-95'}`}
            >
               {hasPlayedClassroomToday() ? <Lock className="text-slate-500 mb-6 mx-auto" size={80}/> : <Star className="text-orange-400 mb-4 md:mb-6 mx-auto group-hover:rotate-12 transition-all w-16 h-16 md:w-20 md:h-20" fill="currentColor" />}
               <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">ห้องเรียนหรรษา</h2>
               <p className="text-slate-400 text-sm md:text-lg text-center">{hasPlayedClassroomToday() ? 'วันนี้คุณเล่นเก็บคะแนนครบแล้วครับ 😊' : 'เข้าฐานโจทย์เก็บคะแนน'}</p>
            </button>

            <button onClick={() => { setGameMode('FREEPLAY'); setScreen('THEME_SELECT'); }} className="group relative bg-slate-800 p-8 md:p-12 rounded-[40px] border-4 border-cyan-500/30 hover:border-cyan-400 transition-all hover:scale-105 shadow-2xl overflow-hidden active:scale-95">
               <Gamepad2 className="text-cyan-400 mb-4 md:mb-6 mx-auto group-hover:-rotate-12 transition-all w-16 h-16 md:w-20 md:h-20" size={80} />
               <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">เล่นตามใจ</h2>
               <p className="text-slate-400 text-sm md:text-lg text-center">สุ่มโจทย์จากคลังมหาสนุก</p>
            </button>
          </div>
          <button onClick={() => setScreen('LOGIN')} className="mt-10 md:mt-16 text-slate-500 underline font-bold hover:text-white transition-colors text-lg">ออกจากระบบ</button>
        </div>
      )}

      {screen === 'THEME_SELECT' && (
        <div className="flex-1 overflow-y-auto p-6 py-10 bg-slate-900 text-white flex flex-col items-center">
           <h1 className="text-4xl md:text-5xl font-bold mb-10 py-6 text-center leading-[1.8]">เลือกดินแดนผจญภัย</h1>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl w-full px-4">
              {THEMES.map((theme) => {
                  const bgUrl = themeBackgrounds[theme.id];
                  const hasCustomBg = bgUrl && bgUrl.trim() !== '';

                  return (
                    <button 
                        key={theme.id} 
                        onClick={() => { 
                            let targetTheme = theme;
                            if (theme.id === 'random') {
                                const realThemes = THEMES.filter(t => t.id !== 'random');
                                targetTheme = realThemes[Math.floor(Math.random() * realThemes.length)];
                            }

                            // [แก้ไข] ล้างข้อมูลเก่าทิ้ง เพื่อบังคับใช้รูปใหม่
                            localStorage.removeItem('math_game_session_players');
                            localStorage.removeItem('math_game_session_index');

                            setSelectedTheme(targetTheme); 
                            setScreen('GAME'); 
                            
                            const s = currentStudentId === '00' ? null : StorageService.getStudent(currentStudentId!); 
                            setGamePlayers([{
                                ...(s || {
                                    id:'00', 
                                    firstName:guestName, 
                                    lastName: '', 
                                    nickname:guestName, 
                                    gender:'MALE', 
                                    classroom:'ทั่วไป', 
                                    // [แก้ไขสำคัญ] ยัดรูป Emoji ที่แปลงแล้วลงไปเป็น profileImage
                                    profileImage: currentStudentId === '00' ? emojiToDataUrl(currentGuestAvatar) : undefined,
                                    appearance:{base:'BOY', skinColor:'#fcd34d'}, 
                                    sessions:[]
                                }), 
                                position:0, score:0, character:'BOY', calculatorUsesLeft:2, isFinished:false
                            }]); 
                            setSessionDetails([]);
                        }} 
                        className="p-10 rounded-[35px] font-bold text-xl md:text-2xl text-white shadow-2xl hover:scale-105 transition-all relative overflow-hidden group border-4 border-white/5 h-36 md:h-auto flex items-center justify-center text-center"
                    >
                        {hasCustomBg ? (
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${bgUrl})` }}>
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            </div>
                        ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${theme.id === 'random' ? 'from-indigo-600 via-purple-600 to-pink-600 animate-gradient-xy' : theme.id === 'space' ? 'from-blue-900 to-black' : theme.id === 'jungle' ? 'from-green-800 to-emerald-900' : 'from-gray-700 to-gray-900'}`}></div>
                        )}
                        
                        <div className="relative z-10 drop-shadow-md flex flex-col items-center gap-2">
                            {theme.id === 'random' && <Shuffle size={32} className="animate-spin-slow mb-1" />}
                            <span>{theme.name}</span>
                        </div>
                    </button>
                  );
              })}
           </div>
           <button onClick={() => setScreen('MODE_SELECT')} className="mt-12 text-slate-500 underline font-bold text-xl">ย้อนกลับ</button>
        </div>
      )}

      {screen === 'GAME' && selectedTheme && (
        <GameBoard 
            players={gamePlayers} currentPlayerIndex={0} theme={selectedTheme} gameMode={gameMode} 
            questions={gameMode === 'CLASSROOM' ? StorageService.getDailyQuestions() : StorageService.getFreeplayQuestions()} 
            onTurnComplete={(p) => setGamePlayers(p)} 
            onQuestionAnswered={(detail) => setSessionDetails(prev => [...prev, detail])} 
            onGameEnd={() => { 
                StorageService.addSession(currentStudentId!, { sessionId: Date.now().toString(), date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString(), score: gamePlayers[0].score, mode: gameMode, details: sessionDetails });
                setScreen('MODE_SELECT'); setSelectedTheme(null); 
            }} 
            onExit={() => setScreen('MODE_SELECT')} 
        />
      )}
    </div>
  );
}