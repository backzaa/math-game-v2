import React, { useId } from 'react';
// แก้ไข: เพิ่มคำว่า type เพื่อให้ TypeScript ไม่ฟ้อง Error
import type { CharacterAppearance, CharacterType } from '../types';

interface Props {
  appearance?: CharacterAppearance;
  theme?: string; 
  className?: string;
  type?: CharacterType;
}

export const CharacterSvg: React.FC<Props> = ({ appearance, theme = 'default', className, type }) => {
  const filterId = useId();
  const shadowUrl = `url(#${filterId})`;

  const base = appearance?.base || 'BOY';
  const skin = appearance?.skinColor || '#fcd34d';

  let effectiveTheme = theme;
  if (theme === 'default' && type) {
      if (['ASTRONAUT', 'ALIEN'].includes(type)) effectiveTheme = 'space';
      else if (['SUPERHERO', 'NINJA'].includes(type)) effectiveTheme = 'volcano';
      else if (['PRINCESS'].includes(type)) effectiveTheme = 'candy';
  }

  const Head = () => <circle cx="50" cy="35" r="28" fill={skin} />;
  const Body = () => (
     <path d="M30 60 Q25 90 50 90 Q75 90 70 60 L65 50 L35 50 Z" fill={base === 'BOY' ? '#3b82f6' : '#ec4899'} />
  );
  
  const ThemeOutfit = () => {
      const t = effectiveTheme.toLowerCase();
      if (t.includes('space')) return <><circle cx="50" cy="35" r="32" fill="none" stroke="#60a5fa" strokeWidth="4" /><path d="M20 60 L80 60 L75 90 L25 90 Z" fill="#e2e8f0" /></>;
      if (t.includes('castle')) return <><path d="M25 20 L75 20 L75 10 L65 10 L65 5 L55 5 L55 10 L45 10 L45 5 L35 5 L35 10 L25 10 Z" fill="#94a3b8" /><path d="M20 60 L50 90 L80 60" fill="none" stroke="#94a3b8" strokeWidth="10" /></>;
      if (t.includes('candy')) return <><circle cx="50" cy="15" r="8" fill="#f472b6" /><path d="M20 60 Q50 100 80 60" fill="none" stroke="#fbcfe8" strokeWidth="8" /></>;
      if (t.includes('jungle')) return <><path d="M20 20 L80 20 L70 10 L30 10 Z" fill="#d97706" /><path d="M25 20 Q50 15 75 20" fill="none" stroke="#b45309" strokeWidth="2" /><path d="M35 55 Q50 65 65 55" fill="none" stroke="#fcd34d" strokeWidth="4" /></>;
      if (t.includes('ocean')) return <><path d="M30 30 L70 30 L70 42 L30 42 Z" fill="rgba(34, 211, 238, 0.4)" stroke="#22d3ee" strokeWidth="2.5" /><path d="M70 35 L85 35 L85 10" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" /></>;
      if (t.includes('volcano')) return <><path d="M22 25 L78 25 L50 5 Z" fill="#dc2626" /><circle cx="50" cy="18" r="4" fill="#facc15" /></>;
      return null;
  };

  const TypeAccessories = () => {
      if (type === 'ALIEN') return <><path d="M30 15 L20 5 M70 15 L80 5" stroke="#22c55e" strokeWidth="3"/><circle cx="20" cy="5" r="3" fill="#22c55e"/><circle cx="80" cy="5" r="3" fill="#22c55e"/></>;
      if (type === 'NINJA') return <path d="M22 25 L78 25 L78 45 L22 45 Z" fill="#1e293b" />;
      return null;
  };

  return (
    <svg viewBox="0 0 100 100" className={`overflow-visible ${className || 'w-full h-full'}`} style={{ filter: shadowUrl }}>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>
      <Body />
      <Head />
      <circle cx="40" cy="35" r="3" fill="#1e293b" />
      <circle cx="60" cy="35" r="3" fill="#1e293b" />
      <path d="M40 45 Q50 50 60 45" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <ThemeOutfit />
      <TypeAccessories />
    </svg>
  );
};