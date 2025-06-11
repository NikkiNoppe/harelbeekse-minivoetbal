
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
      <div className="h-12 w-auto flex items-center justify-center">
        <img 
          src="/lovable-uploads/a7f94171-fc66-434e-a7a0-00abbc7ea1bf.png" 
          alt="KRC Harelbeke Minivoetbal Competitie Logo" 
          className="h-12 w-auto object-contain"
        />
      </div>
    </div>
  );
};

export default Logo;
