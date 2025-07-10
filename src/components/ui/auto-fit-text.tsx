import React, { useEffect, useRef, useState } from 'react';

interface AutoFitTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  maxFontSize?: number;
  minFontSize?: number;
  step?: number;
}

const AutoFitText: React.FC<AutoFitTextProps> = ({
  text,
  className = '',
  style = {},
  maxFontSize = 16,
  minFontSize = 10,
  step = 0.5
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  
  useEffect(() => {
    const adjustFontSize = () => {
      if (!textRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const textElement = textRef.current;
      
      // Reset to max font size to start
      let currentSize = maxFontSize;
      textElement.style.fontSize = `${currentSize}px`;
      
      // Reduce font size until text fits
      while (
        (textElement.scrollWidth > container.clientWidth || 
         textElement.scrollHeight > container.clientHeight) &&
        currentSize > minFontSize
      ) {
        currentSize -= step;
        textElement.style.fontSize = `${currentSize}px`;
      }
      
      setFontSize(currentSize);
    };
    
    // Initial adjustment
    adjustFontSize();
    
    // Adjust on resize
    const resizeObserver = new ResizeObserver(adjustFontSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [text, maxFontSize, minFontSize, step]);
  
  return (
    <div 
      ref={containerRef}
      className={`auto-fit-text-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        ...style
      }}
    >
      <span
        ref={textRef}
        className="auto-fit-text-span"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          display: 'block',
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default AutoFitText; 