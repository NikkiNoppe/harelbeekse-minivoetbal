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
      <div className="h-14 w-auto flex items-center justify-center">
        <img 
          src="/lovable-uploads/Minivoetbal%20transparant.svg" 
          alt="KRC Harelbeke Minivoetbal Competitie Logo" 
          className="h-14 w-auto object-contain px-2"
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default Logo;
