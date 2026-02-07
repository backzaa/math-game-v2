import React, { useEffect, useState } from 'react';
import type { ThemeConfig } from '../types';

interface Props {
  theme: ThemeConfig;
  onTransitionEnd: () => void;
  // [จุดแก้ที่ 1] เพิ่มการรับค่าข้อความและวิดีโอ
  customText?: string;
  preloadVideos?: string[];
}

// Master configuration for high-quality, abstract theme effects
const themeEffects = {
  space: {
    bg: 'bg-black',
    particles: {
      count: 50,
      className: 'w-1 h-40 bg-gradient-to-b from-white/90 to-transparent',
    }
  },
  jungle: {
    bg: 'bg-green-900',
    particles: {
      count: 30,
      className: 'w-12 h-12 bg-green-400/30 rounded-full blur-md',
    }
  },
  ocean: {
    bg: 'bg-blue-900',
    particles: {
      count: 40,
      className: 'w-5 h-5 bg-cyan-300/50 rounded-full border-2 border-white/70 blur-sm',
    }
  },
  volcano: {
    bg: 'bg-slate-900',
    particles: {
      count: 70,
      className: 'w-2 h-2 bg-orange-400 rounded-full shadow-[0_0_15px_5px_rgba(251,146,60,0.7)]',
    }
  },
  candy: {
    bg: 'bg-pink-300',
    particles: {
      count: 25,
      className: 'w-8 h-8 bg-white/40 rounded-lg rotate-45',
      colors: ['bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400']
    }
  },
  castle: {
    bg: 'bg-indigo-900',
    particles: {
      count: 60,
      className: 'w-1 h-1 bg-yellow-200/80 rounded-full shadow-[0_0_8px_2px_rgba(253,224,71,0.6)]',
    }
  },
  boat: {
    bg: 'bg-sky-400',
    particles: {
      count: 20,
      className: 'w-20 h-1 bg-white/30 rounded-full blur-sm',
    }
  },
  random: {
    bg: 'bg-purple-900',
    particles: {
      count: 50,
      className: 'w-3 h-3 bg-white/20 rounded-full animate-pulse',
    }
  }
};

export const TravelTransition: React.FC<Props> = ({ theme, onTransitionEnd, customText, preloadVideos }) => {
  // @ts-ignore
  const effectKey = Object.keys(themeEffects).find(k => theme.id.includes(k)) || 'space';
  // @ts-ignore
  const effects = themeEffects[effectKey] || themeEffects['space'];
  
  const [loadStatus, setLoadStatus] = useState('');

  // [จุดแก้ที่ 2] เปลี่ยน useEffect เดิม เป็น Logic รอเวลา + โหลดวิดีโอ
  useEffect(() => {
    // 1. รอเวลา Animation พื้นฐาน 3 วินาที (เพื่อให้ User อ่านทันตามเดิม)
    const minWait = new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Logic โหลดวิดีโอ (Preload)
    const videoWait = new Promise<void>(resolve => {
        if (!preloadVideos || preloadVideos.length === 0) {
            resolve();
            return;
        }

        let loaded = 0;
        const total = preloadVideos.length;
        setLoadStatus(`กำลังเตรียมสนาม... 0/${total}`);

        preloadVideos.forEach(src => {
            const vid = document.createElement('video');
            vid.src = src;
            vid.preload = 'auto';
            
            const checkDone = () => {
                loaded++;
                setLoadStatus(`กำลังเตรียมสนาม... ${loaded}/${total}`);
                if (loaded >= total) resolve();
            };

            vid.oncanplaythrough = checkDone; 
            vid.onerror = checkDone; 
            vid.load();
        });
    });

    // รอทั้งคู่เสร็จ (Animation + Video) แล้วค่อยไปต่อ
    Promise.all([minWait, videoWait]).then(() => {
        onTransitionEnd();
    });

  }, [onTransitionEnd, preloadVideos]);

  return (
    <div className={`fixed inset-0 z-[2000] overflow-hidden flex items-center justify-center ${effects.bg} transition-colors duration-1000`}>
        {/* Style Block นี้สำคัญมาก! ห้ามลบ ไม่งั้นข้อความไม่ขึ้น */}
        <style>{`
          @keyframes text-fade-in {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-text-fade-in {
            animation: text-fade-in 1s ease-out forwards;
            animation-delay: 0.5s;
          }
          @keyframes float-particle {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)); opacity: 0; }
          }
          .particle {
            position: absolute;
            animation: float-particle 4s infinite linear;
          }
        `}</style>

        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: effects.particles.count }).map((_, i) => {
            // @ts-ignore
            const particleConfig = effects.particles;
            let particleClass = particleConfig.className;

            if ('colors' in particleConfig && particleConfig.colors) {
              particleClass = `${particleClass} ${particleConfig.colors[i % particleConfig.colors.length]}`;
            }
            
            return (
              <div
                key={i}
                className={`particle ${particleClass}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  '--tx': `${(Math.random() - 0.5) * 200}px`,
                  '--ty': `${(Math.random() - 0.5) * 200}px`,
                  '--r': `${Math.random() * 360}deg`,
                  animationDelay: `${Math.random() * -4}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <div className="text-center opacity-0 animate-text-fade-in" style={{fontFamily: "'Kanit', sans-serif"}}>
                <h2 className="text-3xl md:text-5xl font-light text-white/80 mb-4 tracking-wider drop-shadow-md">
                    กำลังเดินทางไป...
                </h2>
                {/* [จุดแก้ที่ 3] แสดง customText หรือ ชื่อธีมเดิม */}
                <p className="text-yellow-300 text-4xl md:text-7xl font-extrabold tracking-wide drop-shadow-[0_4px_15px_rgba(250,204,21,0.6)] scale-110">
                    {customText || theme.name}
                </p>
                {loadStatus && (
                    <div className="mt-4 text-white/70 font-mono text-sm bg-black/40 px-3 py-1 rounded-full animate-pulse">
                        {loadStatus}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};