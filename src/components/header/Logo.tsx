
import React from "react";

interface LogoProps {
  onClick: () => void;
}

const Logo: React.FC<LogoProps> = ({ onClick }) => {
  return (
    <div 
      className="flex items-center gap-3 cursor-pointer" 
      onClick={onClick} 
      role="button" 
      aria-label="Go to home page"
    >
      <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md">
        <svg className="h-8 w-8 text-purple-light" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 15L9 9.75L12 4.5L15 9.75L12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 10.5L12 15L16.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 19.5L12 15L16.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h1 className="text-white text-lg font-bold tracking-tight md:text-lg">Harelbeekse Minivoetbal</h1>
        <p className="text-purple-light-gray text-xs md:text-sm">Competitie</p>
      </div>
    </div>
  );
};

export default Logo;
