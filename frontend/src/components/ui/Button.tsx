import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: ButtonProps) {
  
  // Gaya dasar yang dimiliki semua tombol
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none";
  
  // Varian warna dan gaya
  const variants = {
    primary: "bg-[#F4A261] text-white hover:bg-[#E88D67] shadow-[0_4px_10px_rgba(244,162,97,0.15)] hover:shadow-[0_8px_20px_rgba(244,162,97,0.25)] hover:-translate-y-1",
    secondary: "bg-white text-[#4A5568] border border-gray-200 hover:border-[#F4A261] hover:text-[#F4A261] shadow-sm",
    ghost: "bg-transparent text-[#718096] hover:bg-gray-100 hover:text-[#2D3748]"
  };

  // Ukuran tombol
  const sizes = {
    sm: "py-2 px-4 text-[13px] rounded-lg gap-1.5",
    md: "py-3 px-6 text-[15px] rounded-xl gap-2",
    lg: "py-4 px-8 text-[16px] rounded-xl gap-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}