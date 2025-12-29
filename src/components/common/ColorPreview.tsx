import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Parse colors from club_colors string format
 * Supports formats like: "name-#HEX1-#HEX2" or "name-#HEX1" or old formats
 */
const parseColors = (colorString: string): string[] => {
  if (!colorString) return [];
  
  // Helper to convert hex/rgb to hex
  const getHexFromColor = (color: string): string => {
    if (color.startsWith('#')) {
      return color;
    }
    if (color.startsWith('rgb')) {
      const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
      if (!result) return '#000000';
      const r = parseInt(result[1], 10);
      const g = parseInt(result[2], 10);
      const b = parseInt(result[3], 10);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return '#000000';
  };
  
  // Check if it's the new format: "name-#HEX1-#HEX2" or "name-#HEX1"
  // Extract only hex colors (parts starting with #)
  const parts = colorString.split('-').map(p => p.trim()).filter(p => p.length > 0);
  const hexColors = parts.filter(part => part.startsWith('#') || /^#[0-9A-Fa-f]{6}$/i.test(part));
  
  // If we found hex colors in the new format, return only those
  if (hexColors.length > 0) {
    return hexColors.map(color => {
      // Ensure it starts with #
      if (color.startsWith('#')) {
        return color;
      }
      // If it's a 6-digit hex without #, add it
      if (/^[0-9A-Fa-f]{6}$/i.test(color)) {
        return `#${color}`;
      }
      return getHexFromColor(color);
    }).filter(c => c && c.length > 0);
  }
  
  // Fallback to old format parsing
  // Try to split by common separators
  const separators = ['-', ',', ' ', '/'];
  let colors: string[] = [];
  
  for (const sep of separators) {
    if (colorString.includes(sep)) {
      colors = colorString.split(sep).map(c => c.trim()).filter(c => c.length > 0);
      if (colors.length > 1) break;
    }
  }
  
  // If no separator found, return single color
  if (colors.length === 0) {
    colors = [colorString.trim()];
  }
  
  // Convert all to hex format for display, but filter out non-hex parts
  return colors.map(color => {
    // If it's already hex or rgb, use it
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return getHexFromColor(color);
    }
    // Try to parse as hex (might be missing #)
    if (/^[0-9A-Fa-f]{6}$/i.test(color)) {
      return `#${color}`;
    }
    // Skip non-hex color names in the new format
    // Only return if it's a valid hex/rgb color
    return null;
  }).filter((c): c is string => c !== null && c.length > 0);
};

interface ColorPreviewProps {
  clubColors: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Component to render color preview with support for multiple colors
 * Shows colored circles (bolletjes) like on the profile page
 */
export const ColorPreview: React.FC<ColorPreviewProps> = ({ 
  clubColors, 
  size = 'md', 
  className = '' 
}) => {
  // Use useMemo to ensure colors are recalculated when clubColors changes
  const colors = useMemo(() => parseColors(clubColors || ''), [clubColors]);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  if (colors.length === 0) {
    return (
      <div className={cn("rounded-full border border-primary/30 shadow-sm bg-muted", sizeClasses[size], className)} />
    );
  }
  
  if (colors.length === 1) {
    return (
      <div 
        className={cn("rounded-full border border-primary/30 shadow-sm", sizeClasses[size], className)}
        style={{ backgroundColor: colors[0] }}
      />
    );
  }
  
  // Multiple colors: show as two circles side by side
  const circleSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12';
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div 
        className={cn("rounded-full border border-primary/30 shadow-sm", circleSize)}
        style={{ backgroundColor: colors[0] }}
      />
      <div 
        className={cn("rounded-full border border-primary/30 shadow-sm", circleSize)}
        style={{ backgroundColor: colors[1] }}
      />
    </div>
  );
};

