import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"entering" | "entered">("entering");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("entering");
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("entered");
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setTransitionStage("entered");
    }
  }, [location, displayLocation]);

  return (
    <div
      className={cn(
        "page-transition-enter",
        transitionStage === "entering" && "opacity-0",
        transitionStage === "entered" && "opacity-100",
        "transition-opacity duration-200 ease-in-out",
        className
      )}
      style={{
        transitionDuration: "var(--transition-base)",
        transitionTimingFunction: "var(--transition-timing)",
      }}
    >
      {children}
    </div>
  );
};


