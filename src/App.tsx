import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GameBoard } from './components/GameBoard';
import { SmartBoard } from './components/SmartBoard'; 
import { StorageService } from './services/storage'; 
import type { UserRole, ThemeConfig, PlayerState, ScoringMode, QuestionDetail, GameType } from './types'; 
import { 
  Star, Gamepad2, CloudSync, 
  Plus, Divide,
  Smile, Backpack, BookOpen, Infinity, Pi, Lock, CheckCircle2, Shuffle,
  Music, SkipForward, Play, Pause, Settings, Map, Flag 
} from 'lucide-react';
import { PageTransition } from './components/PageTransition';
import { TravelTransition } from './components/TravelTransition';

const THEMES: ThemeConfig[] = [
  { id: 'jungle', name: 'ป่ามหาสนุก', bgClass: 'jungle', primaryColor: 'green', secondaryColor: 'orange', decorations: [], bgmUrls: [] },
  { id: 'space', name: 'ผจญภัยอวกาศ', bgClass: 'space', primaryColor: 'blue', secondaryColor: 'purple', decorations: [], bgmUrls: [] },
  { id: 'boat', name: 'แม่น้ำแสนซน', bgClass: 'boat', primaryColor: 'cyan', secondaryColor: 'yellow', decorations: [], bgmUrls: [] },
  { id: 'ocean', name: 'โลกใต้ทะเล', bgClass: 'ocean', primaryColor: 'blue', secondaryColor: 'teal', decorations: [], bgmUrls: [] },
  { id: 'volcano', name: 'ภูเขาไฟ', bgClass: 'volcano', primaryColor: 'red', secondaryColor: 'orange', decorations: [], bgmUrls: [] },
  { id: 'candy', name: 'เมืองขนมหวาน', bgClass: 'candy', primaryColor: 'pink', secondaryColor: 'purple', decorations: [], bgmUrls: [] },
  { id: 'castle', name: 'ปราสาทพาสเทล', bgClass: 'castle', primaryColor: 'gray', secondaryColor: 'gold', decorations: [], bgmUrls: [] },
  { id: 'random', name: 'สุ่มดินแดน', bgClass: 'random', primaryColor: 'indigo', secondaryColor: 'rose', decorations: [], bgmUrls: [] },
];

const RUNNER_VIDEOS = [
  '/runner-vids/idle.mp4',
  '/runner-vids/run.mp4',
  '/runner-vids/sprint.mp4',
  '/runner-vids/fall.mp4',
  '/runner-vids/finish.mp4'
];

const HOME_THEME: ThemeConfig = { 
  id: 'home', 
  name: 'บ้านของฉัน...', 
  bgClass: 'bg-slate-900', 
  primaryColor: 'gray',
  secondaryColor: 'white',
  decorations: [],
  bgmUrls: []
};

export function App() {
  const [screen, setScreen] = useState<'LOADING' | 'LOGIN' | 'GAME_TYPE_SELECT' | 'MODE_SELECT' | 'THEME_SELECT' | 'TRAVELING' | 'RETURNING' | 'GAME' | 'DASHBOARD'>('LOADING');
  
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [currentGuestAvatar, setCurrentGuestAvatar] = useState<string>('');

  const [gameType, setGameType] = useState<GameType>('CLASSIC');
  
  const [gameMode, setGameMode] = useState<ScoringMode>('CLASSROOM');
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [gamePlayers, setGamePlayers] = useState<PlayerState[]>([]);
  const [sessionDetails, setSessionDetails] = useState<QuestionDetail[]>([]);
  
  const [themeBackgrounds, setThemeBackgrounds] = useState<Record<string, string>>({});

  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState('กำลังเตรียมตัวผจญภัย...');
  const isDataLoaded = useRef(false);

  const [menuPlaylist, setMenuPlaylist] = useState<string[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string[]>([]);

  const fadeIntervalRef = useRef<any>(null);

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
        if (config) {
            if (config.themeBackgrounds) setThemeBackgrounds(config.themeBackgrounds);
            if (config.menuPlaylist) setMenuPlaylist(config.menuPlaylist);
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

  const handleLogin = (role: UserRole, id: string, guestNickname?: string, guestAvatar?: string) => {
    if (role === 'TEACHER') setScreen('DASHBOARD');
    else {
      setCurrentStudentId(id);
      if (id === '00' && guestNickname) {
          setGuestName(guestNickname);
          if (guestAvatar) setCurrentGuestAvatar(guestAvatar);
      }
      setScreen('GAME_TYPE_SELECT');
    }
  };

  const emojiToDataUrl = (emoji: string) => {
    const gradients = [
        ['#ff9a9e', '#fecfef'], ['#a18cd1', '#fbc2eb'], ['#84fab0', '#8fd3f4'],
        ['#fccb90', '#d57eeb'], ['#e0c3fc', '#8ec5fc'], ['#ffecd2', '#fcb69f'],
        ['#ff9a9e', '#fecfef'], 
    ];
    const colorIndex = emoji.charCodeAt(0) % gradients.length;
    const [c1, c2] = gradients[colorIndex];

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}" />
            <stop offset="100%" stop-color="${c2}" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#grad)" />
        <text x="50%" y="55%" font-size="70" text-anchor="middle" dominant-baseline="central">${emoji}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const getDirectAudioLink = (url: string) => { if (!url) return ''; if (url.includes('dropbox.com')) return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', ''); if (url.includes('drive.google.com') && url.includes('/d/')) { const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/); if (idMatch && idMatch[1]) return `https://docs.google.com/uc?export=download&id=${idMatch[1]}`; } return url; };
  
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  };

  const [bgmVolume, setBgmVolume] = useState(isMobileDevice() ? 0.8 : (0.8 * 0.7));
  const [sfxVolume, setSfxVolume] = useState(isMobileDevice() ? 0.3 : (0.4 * 0.7));
  const [showSettings, setShowSettings] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fadeAudio = (targetVolume: number, duration: number, onComplete?: () => void) => {
      if (!audioRef.current) return;
      
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

      const startVolume = audioRef.current.volume;
      const startTime = Date.now();
      const audio = audioRef.current;

      fadeIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const newVolume = startVolume + (targetVolume - startVolume) * progress;
          
          if (audio) {
              audio.volume = Math.max(0, Math.min(1, newVolume));
          }

          if (progress >= 1) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
              if (onComplete) onComplete();
          }
      }, 50);
  };

  const handleGlobalClick = () => {
      if (!hasInteracted) {
          setHasInteracted(true);
          setIsPlaying(true);
          if (audioRef.current && activePlaylist.length > 0) {
              audioRef.current.play().catch(e => console.log("Audio auto-start on click", e));
          }
      }
  };

  useEffect(() => { 
      if (hasInteracted && activePlaylist.length > 0 && audioRef.current) { 
          const rawLink = activePlaylist[currentSongIndex]; 
          const directLink = getDirectAudioLink(rawLink); 
          if (audioRef.current.src !== directLink) { 
              audioRef.current.src = directLink; 
              audioRef.current.load(); 
              const playPromise = audioRef.current.play(); 
              if (playPromise !== undefined) { 
                  playPromise.then(() => { setIsPlaying(true); setAudioError(false); }).catch(error => { console.log("Auto-play prevented", error); setIsPlaying(false); setAudioError(true); }); 
              } 
          } else if (audioRef.current.paused && isPlaying) {
              audioRef.current.play().catch(() => {});
          }
      } else if (activePlaylist.length === 0 && audioRef.current) {
          if (!fadeIntervalRef.current) {
             audioRef.current.pause(); 
             audioRef.current.currentTime = 0;
          }
      }
  }, [currentSongIndex, activePlaylist, hasInteracted]);

  useEffect(() => {
      if (['LOGIN', 'GAME_TYPE_SELECT', 'MODE_SELECT', 'THEME_SELECT', 'TRAVELING', 'RETURNING'].includes(screen)) {
          if (activePlaylist !== menuPlaylist) {
              setActivePlaylist(menuPlaylist);
              if (menuPlaylist.length > 0 && activePlaylist.length === 0) {
                  setCurrentSongIndex(0);
                  if (audioRef.current) {
                      audioRef.current.volume = 0;
                      audioRef.current.play().catch(()=>{});
                      fadeAudio(bgmVolume, 1500); 
                  }
              }
          } else {
              if (audioRef.current && audioRef.current.volume < bgmVolume) {
                  fadeAudio(bgmVolume, 1000);
              }
          }
      } 
      else if (screen === 'GAME') {
          if (audioRef.current && !audioRef.current.paused) {
              fadeAudio(0, 1500, () => {
                  setActivePlaylist([]);
                  audioRef.current?.pause();
              });
          } else {
              setActivePlaylist([]);
          }
      } else {
          setActivePlaylist([]);
      }
  }, [screen, menuPlaylist, bgmVolume]);

  useEffect(() => { if (audioRef.current) { if (isPlaying && activePlaylist.length > 0) { const p = audioRef.current.play(); if(p) p.catch(()=>setAudioError(true)); } else if (activePlaylist.length > 0) { audioRef.current.pause(); } } }, [isPlaying, activePlaylist]);
  
  useEffect(() => { 
      if (audioRef.current && !fadeIntervalRef.current) {
          audioRef.current.volume = bgmVolume; 
      }
  }, [bgmVolume]);

  const handleNextSong = () => { if (activePlaylist.length > 0) { setCurrentSongIndex((prev) => (prev + 1) % activePlaylist.length); } };
  const handleSelectSong = (index: number) => { setCurrentSongIndex(index); setIsPlaying(true); setShowMusicMenu(false); setAudioError(false); };
  const forcePlayAudio = () => { setAudioError(false); setIsPlaying(true); if(audioRef.current) audioRef.current.play().catch(e => console.error(e)); };

  const selectMode = (mode: ScoringMode) => {
      setGameMode(mode);
      
      if (gameType === 'RALLY') {
          const defaultTheme = THEMES.find(t => t.id === 'jungle') || THEMES[0];
          
          localStorage.removeItem('math_game_session_players');
          localStorage.removeItem('math_game_session_index');

          setSelectedTheme(defaultTheme);
          setScreen('TRAVELING'); 

          const s = currentStudentId === '00' ? null : StorageService.getStudent(currentStudentId!); 
          setGamePlayers([{
              ...(s || {
                  id:'00', 
                  firstName:guestName, 
                  lastName: '', 
                  nickname:guestName, 
                  gender:'MALE', 
                  classroom:'ทั่วไป', 
                  profileImage: currentStudentId === '00' ? emojiToDataUrl(currentGuestAvatar) : undefined,
                  appearance:{base:'BOY', skinColor:'#fcd34d'}, 
                  sessions:[]
              }), 
              position:0, score:0, character:'BOY', 
              calculatorUsesLeft: mode === 'FREEPLAY' ? 2 : 0, 
              isFinished:false
          }]); 
          setSessionDetails([]); 

      } else {
          setScreen('THEME_SELECT');
      }
  };

  const renderContent = () => {
    const transitionScreens = ['LOGIN', 'GAME_TYPE_SELECT', 'MODE_SELECT', 'THEME_SELECT'];
    if (transitionScreens.includes(screen)) {
      return (
        <PageTransition contentKey={screen}>
          {screen === 'LOGIN' && <LoginScreen onLogin={handleLogin} />}
          
          {screen === 'GAME_TYPE_SELECT' && (
             <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start md:justify-center p-4 py-10 md:p-8 bg-slate-900 text-white font-bold">
                <h1 className="text-2xl md:text-5xl font-black mb-8 md:mb-16 py-10 px-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 text-center drop-shadow-sm leading-[2.5]">
                    เลือกรูปแบบการผจญภัย
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4">
                    <button 
                        onClick={() => { setGameType('CLASSIC'); setScreen('MODE_SELECT'); }} 
                        className="group relative p-8 md:p-12 rounded-[40px] bg-slate-800 border-4 border-blue-500/30 hover:border-blue-400 hover:scale-105 transition-all shadow-2xl overflow-hidden active:scale-95"
                    >
                        <Map className="text-blue-400 mb-6 mx-auto w-20 h-20 group-hover:rotate-12 transition-all" />
                        <h2 className="text-3xl font-bold mb-2 text-center text-blue-300">ผจญภัยเข้าเส้นชัย</h2>
                        <p className="text-slate-400 text-lg text-center">แบบดั้งเดิม เดินตามช่องเข้าเส้นชัย</p>
                    </button>

                    <button 
                        onClick={() => { setGameType('RALLY'); setScreen('MODE_SELECT'); }} 
                        className="group relative p-8 md:p-12 rounded-[40px] bg-slate-800 border-4 border-orange-500/30 hover:border-orange-400 hover:scale-105 transition-all shadow-2xl overflow-hidden active:scale-95"
                    >
                        <Flag className="text-orange-400 mb-6 mx-auto w-20 h-20 group-hover:-rotate-12 transition-all" />
                        <h2 className="text-3xl font-bold mb-2 text-center text-orange-300">แข่งระยะทาง</h2>
                        <p className="text-slate-400 text-lg text-center">ตอบถูกเพื่อเดิน สะสมระยะทางให้ไกลที่สุด!</p>
                    </button>
                </div>
                <button onClick={() => setScreen('LOGIN')} className="mt-10 md:mt-16 text-slate-500 underline font-bold hover:text-white transition-colors text-lg">ออกจากระบบ</button>
             </div>
          )}

          {screen === 'MODE_SELECT' && (
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start md:justify-center p-4 py-10 md:p-8 bg-slate-900 text-white font-bold">
              <h1 className="text-2xl md:text-5xl font-black mb-8 md:mb-16 py-10 px-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 text-center drop-shadow-sm leading-[2.5]">
                {gameType === 'CLASSIC' ? 'ผจญภัยเข้าเส้นชัย' : 'แข่งระยะทาง'} - เลือกโหมด
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4">
                <button 
                  disabled={hasPlayedClassroomToday()}
                  onClick={() => selectMode('CLASSROOM')} 
                  className={`group relative p-8 md:p-12 rounded-[40px] border-4 transition-all shadow-2xl overflow-hidden ${hasPlayedClassroomToday() ? 'bg-slate-800/50 border-slate-700 opacity-60 grayscale cursor-not-allowed' : 'bg-slate-800 border-orange-500/30 hover:border-orange-400 hover:scale-105 active:scale-95'}`}
                >
                   {hasPlayedClassroomToday() ? <Lock className="text-slate-500 mb-6 mx-auto" size={80}/> : <Star className="text-orange-400 mb-4 md:mb-6 mx-auto group-hover:rotate-12 transition-all w-16 h-16 md:w-20 md:h-20" fill="currentColor" />}
                   <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">ห้องเรียนหรรษา</h2>
                   <p className="text-slate-400 text-sm md:text-lg text-center">{hasPlayedClassroomToday() ? 'วันนี้คุณเล่นเก็บคะแนนครบแล้วครับ 😊' : 'เก็บคะแนนจริงจัง (10 ข้อ)'}</p>
                </button>
    
                <button 
                    onClick={() => selectMode('FREEPLAY')} 
                    className="group relative bg-slate-800 p-8 md:p-12 rounded-[40px] border-4 border-cyan-500/30 hover:border-cyan-400 transition-all hover:scale-105 shadow-2xl overflow-hidden active:scale-95"
                >
                   <Gamepad2 className="text-cyan-400 mb-4 md:mb-6 mx-auto group-hover:-rotate-12 transition-all w-16 h-16 md:w-20 md:h-20" size={80} />
                   <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">เล่นตามใจ</h2>
                   <p className="text-slate-400 text-sm md:text-lg text-center">ฝึกฝนฝีมือ (ไม่จำกัด)</p>
                </button>
              </div>
              <button onClick={() => setScreen('GAME_TYPE_SELECT')} className="mt-10 md:mt-16 text-slate-500 underline font-bold hover:text-white transition-colors text-lg">ย้อนกลับ</button>
            </div>
          )}

          {screen === 'THEME_SELECT' && (
            <div className="flex-1 overflow-y-auto p-6 py-10 bg-slate-900 text-white flex flex-col items-center">
               <h1 className="text-4xl md:text-5xl font-bold mb-10 py-6 text-center leading-[1.8]">เลือกดินแดนผจญภัย</h1>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl w-full px-4">
                  {THEMES.map((theme) => {
                      const bgUrl = themeBackgrounds[theme.id];
                      const hasCustomBg = bgUrl && bgUrl.trim() !== '';
                      const isVideo = hasCustomBg && (bgUrl.toLowerCase().endsWith('.mp4') || bgUrl.toLowerCase().includes('#.mp4'));

                      return (
                        <button 
                            key={theme.id} 
                            onClick={() => { 
                                let targetTheme = theme;
                                if (theme.id === 'random') {
                                    const realThemes = THEMES.filter(t => t.id !== 'random');
                                    targetTheme = realThemes[Math.floor(Math.random() * realThemes.length)];
                                }

                                localStorage.removeItem('math_game_session_players');
                                localStorage.removeItem('math_game_session_index');

                                setSelectedTheme(targetTheme); 
                                setScreen('TRAVELING'); 
                                
                                const s = currentStudentId === '00' ? null : StorageService.getStudent(currentStudentId!); 
                                setGamePlayers([{
                                    ...(s || {
                                        id:'00', 
                                        firstName:guestName, 
                                        lastName: '', 
                                        nickname:guestName, 
                                        gender:'MALE', 
                                        classroom:'ทั่วไป', 
                                        profileImage: currentStudentId === '00' ? emojiToDataUrl(currentGuestAvatar) : undefined,
                                        appearance:{base:'BOY', skinColor:'#fcd34d'}, 
                                        sessions:[]
                                    }), 
                                    position:0, score:0, character:'BOY', 
                                    calculatorUsesLeft: gameMode === 'FREEPLAY' ? 2 : 0, 
                                    isFinished:false
                                }]); 
                                setSessionDetails([]);
                            }} 
                            className="p-10 rounded-[35px] font-bold text-xl md:text-2xl text-white shadow-2xl hover:scale-105 transition-all relative overflow-hidden group border-4 border-white/5 h-36 md:h-auto flex items-center justify-center text-center"
                        >
                            {hasCustomBg ? (
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110">
                                    {isVideo ? (
                                        <video 
                                            src={getDirectAudioLink(bgUrl)} 
                                            className="w-full h-full object-cover opacity-80"
                                            autoPlay loop muted playsInline
                                        />
                                    ) : (
                                        <div className="w-full h-full" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                    )}
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
        </PageTransition>
      );
    }

    if (screen === 'TRAVELING' && selectedTheme) {
      return (
        <TravelTransition 
            theme={selectedTheme} 
            onTransitionEnd={() => setScreen('GAME')}
            customText={gameType === 'RALLY' ? 'แข่งวิ่งมาราธอน' : undefined}
            preloadVideos={gameType === 'RALLY' ? RUNNER_VIDEOS : undefined}
        />
      );
    }

    if (screen === 'RETURNING') {
      return <TravelTransition theme={HOME_THEME} onTransitionEnd={() => setScreen('MODE_SELECT')} />;
    }

    if (screen === 'DASHBOARD') {
      return <TeacherDashboard onLogout={() => setScreen('LOGIN')} />;
    }

    if (screen === 'GAME' && selectedTheme) {
      if (gameType === 'RALLY') {
          return (
             <SmartBoard 
                player={gamePlayers[0]}
                theme={selectedTheme}
                questions={gameMode === 'CLASSROOM' ? StorageService.getDailyQuestions() : StorageService.getFreeplayQuestions()}
                onQuestionAnswered={(detail) => setSessionDetails(prev => [...prev, detail])} // [เพิ่ม] รับค่า Details
                onGameEnd={(dist, score) => {
                    if (currentStudentId) {
                        // [แก้ไข] ส่งข้อมูล Rally ไปบันทึก
                        // @ts-ignore
                        StorageService.addSession(currentStudentId, { 
                            sessionId: Date.now().toString(), 
                            date: new Date().toISOString().split('T')[0], 
                            timestamp: new Date().toISOString(), 
                            score: score, 
                            realScore: score, 
                            bonusScore: 0,
                            mode: gameMode, 
                            details: sessionDetails, // ส่ง Details ที่สะสมมา
                            // @ts-ignore
                            gameType: 'RALLY', 
                            // @ts-ignore
                            totalDistance: dist
                        });
                      }
                      setScreen('RETURNING'); 
                      setSelectedTheme(null);
                }}
                onExit={() => setScreen('RETURNING')}
             />
          );
      } else {
          return (
            <GameBoard 
                players={gamePlayers} 
                currentPlayerIndex={0} 
                theme={selectedTheme} 
                gameMode={gameMode} 
                questions={gameMode === 'CLASSROOM' ? StorageService.getDailyQuestions() : StorageService.getFreeplayQuestions()} 
                onTurnComplete={(p) => setGamePlayers(p)} 
                onQuestionAnswered={(detail) => setSessionDetails(prev => [...prev, detail])} 
                onGameEnd={() => { 
                    if (currentStudentId) {
                    // [แก้ไข] ส่งข้อมูล Classic ไปบันทึก
                    // @ts-ignore
                    StorageService.addSession(currentStudentId, { 
                        sessionId: Date.now().toString(), 
                        date: new Date().toISOString().split('T')[0], 
                        timestamp: new Date().toISOString(), 
                        score: gamePlayers[0].score, 
                        mode: gameMode, 
                        details: sessionDetails,
                        // @ts-ignore
                        gameType: 'CLASSIC',
                        // @ts-ignore
                        totalDistance: 0
                    });
                    }
                    setScreen('RETURNING'); 
                    setSelectedTheme(null); 
                }} 
                onExit={() => setScreen('RETURNING')} 
            />
          );
      }
    }

    return null;
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
          <h2 className="text-2xl font-bold text-white mb-2 py-2 text-center leading-relaxed">รอโหลดสักครู่นะครับ</h2>
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
    <div onClick={handleGlobalClick} className="h-full w-full bg-slate-900 overflow-hidden flex flex-col font-sans" style={{ fontFamily: "'Mali', cursive" }}>
      
      <audio ref={audioRef} onEnded={handleNextSong} crossOrigin="anonymous" className="hidden" />
      
      {audioError && hasInteracted && activePlaylist.length > 0 && (<div className="absolute top-16 md:top-20 right-4 z-50 animate-bounce"><button onClick={forcePlayAudio} className="bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-full font-bold shadow-lg flex items-center gap-2 text-xs md:text-base"><Music className="animate-pulse" size={16}/> เล่นเพลง</button></div>)}

      {/* ซ่อนเมนู Controls ถ้าอยู่ในหน้าเล่นเกม */}
      {screen !== 'GAME' && (
        <div className="absolute top-2 md:top-4 right-2 md:right-4 z-50 flex flex-col items-end gap-2">
            {activePlaylist.length > 0 && (<div className="relative"><button onClick={() => setShowMusicMenu(!showMusicMenu)} className="bg-slate-900/80 p-2 md:p-3 rounded-full text-white hover:bg-slate-800 shadow-lg border border-slate-700"><Music size={20} className={isPlaying ? "animate-pulse text-green-400" : "text-slate-400"} /></button>{showMusicMenu && (<div className="absolute right-0 mt-2 bg-slate-900/95 p-3 md:p-4 rounded-xl border border-slate-600 shadow-2xl w-48 md:w-64 backdrop-blur-md z-[3000]"><div className="flex gap-2 mb-2"><button onClick={() => setIsPlaying(!isPlaying)} className="flex-1 bg-slate-700 py-2 rounded flex justify-center">{isPlaying ? <Pause size={16}/> : <Play size={16}/>}</button><button onClick={handleNextSong} className="flex-1 bg-slate-700 py-2 rounded flex justify-center"><SkipForward size={16}/></button></div><div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">{activePlaylist.map((_, idx) => (<button key={idx} onClick={() => handleSelectSong(idx)} className={`w-full text-left text-[10px] md:text-xs p-2 rounded truncate ${currentSongIndex === idx ? 'bg-green-600/30 text-green-400' : 'text-slate-400'}`}>🎵 เพลงที่ {idx + 1}</button>))}</div></div>)}</div>)}
            <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-900/80 p-2 md:p-3 rounded-full text-white hover:bg-slate-800 shadow-lg border border-slate-700"><Settings size={20} /></button>
            {showSettings && (<div className="bg-slate-900/90 p-4 rounded-xl border border-slate-600 shadow-2xl backdrop-blur-md text-white w-56 z-[3000]"><div className="mb-4 text-xs"><span>BGM</span><input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer" /></div><div className="text-xs"><span>SFX</span><input type="range" min="0" max="1" step="0.1" value={sfxVolume} onChange={(e) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer" /></div></div>)}
        </div>
      )}

      {renderContent()}
    </div>
  );
}