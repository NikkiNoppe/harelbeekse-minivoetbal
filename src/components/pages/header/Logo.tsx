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
      <div className="h-14 w-[189px] flex items-center justify-center">
        <img
          src="/images/logos/logo-krc-transparent.svg"
          alt="KRC Harelbeke Minivoetbal Competitie Logo"
          className="h-14 w-auto object-contain px-2"
          width={189}
          height={56}
          loading="eager"
          decoding="async"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/logos/Minivoetbal.svg";
          }}
        />
      </div>
    </div>
  );
};

export default Logo;
