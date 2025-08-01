
import React, { useMemo } from "react";
import { Circle, Square, Triangle } from "lucide-react";

interface MatchesCardIconProps {
  type: "none" | "yellow" | "double_yellow" | "red";
  size?: number;
}

const MatchesCardIcon: React.FC<MatchesCardIconProps> = ({ type, size = 16 }) => {
  // Memoize the icon component to prevent unnecessary re-renders
  const iconComponent = useMemo(() => {
    const iconProps = { size, className: "inline-block" };
    
    switch (type) {
      case "yellow":
        return <Circle {...iconProps} className="text-yellow-500 fill-current" />;
      case "double_yellow":
        return (
          <div className="flex gap-1">
            <Circle {...iconProps} className="text-yellow-500 fill-current" />
            <Circle {...iconProps} className="text-yellow-500 fill-current" />
          </div>
        );
      case "red":
        return <Square {...iconProps} className="text-red-500 fill-current" />;
      case "none":
      default:
        return <Circle {...iconProps} className="text-gray-300" />;
    }
  }, [type, size]);

  return iconComponent;
};

export default React.memo(MatchesCardIcon);

