import React from "react";

interface HamburgerIconProps {
  className?: string;
  size?: number;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ className, size = 18 }) => {
  const strokeWidth = 2;
  const radius = 1.5;
  const color = "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="5" width="14" height={strokeWidth} rx={radius} fill={color} />
      <rect x="3" y="9.5" width="14" height={strokeWidth} rx={radius} fill={color} />
      <rect x="3" y="14" width="14" height={strokeWidth} rx={radius} fill={color} />
    </svg>
  );
};

export default HamburgerIcon;


