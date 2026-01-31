import React from 'react';

const styles = `
@keyframes page-enter {
  0% { 
    opacity: 0; 
    transform: scale(0.96) translateY(20px);
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0);
  }
}
.animate-page-enter {
  animation: page-enter 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  width: 100%; height: 100%; display: flex; flex-direction: column;
}
`;

interface Props { children: React.ReactNode; contentKey: string; }

export const PageTransition: React.FC<Props> = ({ children, contentKey }) => {
  return (
    <>
      <style>{styles}</style>
      <div key={contentKey} className="animate-page-enter">{children}</div>
    </>
  );
};