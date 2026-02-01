import React, { useEffect, useState } from 'react';
import type { ThemeConfig } from '../types';

interface Props {
  theme: ThemeConfig;
  onTransitionEnd: () => void;
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
      count: 50,
      className: 'w-4 h-4 rounded-full',
      colors: ['bg-red-400', 'bg-yellow-300', 'bg-blue-400', 'bg-purple-400', 'bg-green-400']
    }
  },
  castle: {
    bg: 'bg-indigo-900',
    particles: {
      count: 60,
      className: 'w-3 h-3 bg-yellow-300/80 rounded-full shadow-[0_0_10px_3px_rgba(250,204,21,0.6)] blur-sm',
    }
  },
  boat: { // Using ocean effects for boat as they are similar
    bg: 'bg-blue-800',
    particles: {
      count: 40,
      className: 'w-5 h-5 bg-cyan-300/50 rounded-full border-2 border-white/70 blur-sm',
    }
  },
  default: {
    bg: 'bg-gray-900',
    particles: {
      count: 40,
      className: 'w-1 h-24 bg-white/50',
    }
  }
};

export const TravelTransition: React.FC<Props> = ({ theme, onTransitionEnd }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const effects = themeEffects[theme.id as keyof typeof themeEffects] || themeEffects.default;

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      onTransitionEnd();
    }, 4000); // Animation duration

    return () => clearTimeout(timer);
  }, [onTransitionEnd]);

  return (
    <>
      <style>{`
        .perspective-container {
          perspective: 800px;
        }
        
        @keyframes zoom-in-reveal {
          from {
            transform: scale(1.2);
            filter: blur(8px) brightness(0.7);
          }
          to {
            transform: scale(1);
            filter: blur(0) brightness(1);
          }
        }
        .animate-zoom-in-reveal {
          animation: zoom-in-reveal 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes rush-in {
          from {
            transform: translateZ(-400px) rotate(var(--r-start)) scale(0.1);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          to {
            transform: translateZ(400px) rotate(var(--r-end)) scale(1.5);
            opacity: 0;
          }
        }
        .particle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-style: preserve-3d;
          animation: rush-in 2s linear infinite;
        }
        
        @keyframes text-fade-in {
            0% { opacity: 0; transform: translateY(30px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-text-fade-in {
            animation: text-fade-in 1.5s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards;
        }
      `}</style>
      <div className={`fixed inset-0 z-50 perspective-container overflow-hidden transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
        
        <div className={`absolute inset-0 w-full h-full animate-zoom-in-reveal ${effects.bg}`}></div>
        
        <div className="absolute inset-0" style={{transformStyle: 'preserve-3d'}}>
          {Array.from({ length: effects.particles.count }).map((_, i) => {
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
                  '--r-start': `${Math.random() * 360}deg`,
                  '--r-end': `${Math.random() * 360}deg`,
                  transform: `translate(-50%, -50%) rotateZ(${Math.random() * 360}deg)`,
                  animationDelay: `${Math.random() * -2}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
            <div className="text-center opacity-0 animate-text-fade-in" style={{fontFamily: "'Kanit', sans-serif"}}>
                <h2 className="text-3xl md:text-5xl font-light text-white/80 mb-3 tracking-wider">
                    กำลังเดินทางไป...
                </h2>
                <p className="text-yellow-300 text-4xl md:text-6xl font-extrabold tracking-wide drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)]">
                    {theme.name}
                </p>
            </div>
        </div>
      </div>
    </>
  );
};