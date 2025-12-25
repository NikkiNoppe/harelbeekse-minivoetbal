import React, { useEffect, useRef, useCallback } from 'react';

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
  const rafRef = useRef<number | null>(null);
  const isAdjustingRef = useRef(false);
  const lastWidthRef = useRef(0);
  
  const adjustFontSize = useCallback(() => {
    // Prevent concurrent adjustments
    if (isAdjustingRef.current) return;
    
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (!textRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const textElement = textRef.current;
      const containerWidth = container.clientWidth;
      
      // Skip if width hasn't changed significantly (prevents flickering)
      if (Math.abs(containerWidth - lastWidthRef.current) < 2) return;
      
      lastWidthRef.current = containerWidth;
      isAdjustingRef.current = true;
      
      // Use a temporary invisible element for measurements to avoid layout thrashing
      const measureSpan = document.createElement('span');
      measureSpan.style.cssText = `
        position: absolute;
        visibility: hidden;
        height: auto;
        width: auto;
        white-space: nowrap;
        font-family: ${window.getComputedStyle(textElement).fontFamily};
        font-weight: ${window.getComputedStyle(textElement).fontWeight};
      `;
      measureSpan.textContent = text;
      document.body.appendChild(measureSpan);
      
      let currentSize = maxFontSize;
      measureSpan.style.fontSize = `${currentSize}px`;
      
      // Binary search for optimal font size (faster than linear)
      let minSize = minFontSize;
      let maxSize = maxFontSize;
      
      while (maxSize - minSize > step) {
        currentSize = (minSize + maxSize) / 2;
        measureSpan.style.fontSize = `${currentSize}px`;
        
        if (measureSpan.offsetWidth <= containerWidth) {
          minSize = currentSize;
        } else {
          maxSize = currentSize;
        }
      }
      
      // Use the size that fits
      currentSize = minSize;
      
      // Clean up measurement element
      document.body.removeChild(measureSpan);
      
      // Apply the final size directly (no state update to prevent re-renders)
      textElement.style.fontSize = `${Math.max(minFontSize, currentSize)}px`;
      
      isAdjustingRef.current = false;
      rafRef.current = null;
    });
  }, [text, maxFontSize, minFontSize, step]);
  
  useEffect(() => {
    // Initial adjustment with a small delay to ensure layout is ready
    const timer = setTimeout(adjustFontSize, 0);
    
    // Use ResizeObserver with debouncing
    let resizeTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(adjustFontSize, 50); // 50ms debounce
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [adjustFontSize]);
  
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
          fontSize: `${maxFontSize}px`,
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          display: 'block',
          transition: 'font-size 0.1s ease-out',
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default AutoFitText; 