import React from "react";

interface SidebarIconProps {
  className?: string;
  size?: number;
}

// Unique sidebar icon: left vertical rail + three menu bars to indicate a sidebar
const SidebarIcon: React.FC<SidebarIconProps> = ({ className, size = 18 }) => {
  const color = "currentColor";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable={false}
    >
      {/* Left rail */}
      <rect x="3" y="3.5" width="2.2" height="13" rx="1.1" fill={color} />
      {/* Bars aligned to the rail */}
      <rect x="6.5" y="5" width="10.5" height="1.8" rx="0.9" fill={color} />
      <rect x="6.5" y="9.1" width="10.5" height="1.8" rx="0.9" fill={color} />
      <rect x="6.5" y="13.2" width="10.5" height="1.8" rx="0.9" fill={color} />
    </svg>
  );
};

export default SidebarIcon;


