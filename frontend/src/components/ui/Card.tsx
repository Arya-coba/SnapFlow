import React from 'react';

export default function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-[#FDFDF9] rounded-[24px] border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${className}`}>
      {children}
    </div>
  );
}