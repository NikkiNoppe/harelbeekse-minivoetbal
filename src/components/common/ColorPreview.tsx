import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Parse colors from club_colors string format
 * Supports formats like: "name-#HEX1-#HEX2" or "name-#HEX1" or old formats
 */
export const parseClubColors = (colorString: string): string[] => {
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

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getLuminance = (hex: string): number => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

/** Higher alpha for light kit colors (wit/geel) so they stay visible on white cards. */
const getKitTintAlpha = (hex: string, base: number): number => {
  const lum = getLuminance(hex);
  if (lum > 0.92) return Math.min(0.5, base + 0.22);
  if (lum > 0.78) return Math.min(0.38, base + 0.12);
  if (lum < 0.12) return Math.min(0.34, base + 0.06);
  return base;
};

/** Diagonal kit split (1 or 2 colors) for a team score column. */
export function getTeamKitColumnStyle(
  clubColors: string | null | undefined,
): React.CSSProperties | undefined {
  const colors = parseClubColors(clubColors || "");
  if (colors.length === 0) return undefined;

  if (colors.length === 1) {
    const alpha = getKitTintAlpha(colors[0], 0.22);
    return {
      backgroundColor: hexToRgba(colors[0], alpha),
      boxShadow: `inset 0 0 0 1px ${hexToRgba(colors[0], Math.min(alpha + 0.12, 0.35))}`,
    };
  }

  const [primary, secondary] = colors;
  const a1 = getKitTintAlpha(primary, 0.28);
  const a2 = getKitTintAlpha(secondary, 0.24);
  return {
    backgroundImage: `linear-gradient(135deg, ${hexToRgba(primary, a1)} 0%, ${hexToRgba(primary, a1)} 49.5%, ${hexToRgba(secondary, a2)} 50.5%, ${hexToRgba(secondary, a2)} 100%)`,
  };
}

/** Full-opacity kit stripe — makes dual colors (bv. blauw-wit) instantly readable. */
export function TeamKitColorBar({
  clubColors,
  className,
}: {
  clubColors: string | null | undefined;
  className?: string;
}) {
  const colors = useMemo(() => parseClubColors(clubColors || ""), [clubColors]);
  if (colors.length === 0) return null;

  if (colors.length === 1) {
    return (
      <div
        className={cn("h-1.5 w-full max-w-[8rem] mx-auto rounded-full border border-primary/15 shadow-sm", className)}
        style={{ backgroundColor: colors[0] }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex h-1.5 w-full max-w-[8rem] overflow-hidden rounded-full border border-primary/15 shadow-sm",
        className,
      )}
      aria-hidden
    >
      <div className="flex-1 min-w-0" style={{ backgroundColor: colors[0] }} />
      <div className="flex-1 min-w-0 border-l border-primary/10" style={{ backgroundColor: colors[1] }} />
    </div>
  );
}

/** Soft outer wash when both teams have colors; columns carry the main kit signal. */
export function getSubtleMatchScoreBackground(
  homeClubColors: string | null | undefined,
  awayClubColors: string | null | undefined,
): React.CSSProperties | undefined {
  const home = parseClubColors(homeClubColors || "");
  const away = parseClubColors(awayClubColors || "");
  if (home.length === 0 && away.length === 0) return undefined;

  const stops: string[] = [];

  if (home.length > 0) {
    const h1 = hexToRgba(home[0], getKitTintAlpha(home[0], 0.1));
    const h2 = hexToRgba(home[1] ?? home[0], getKitTintAlpha(home[1] ?? home[0], 0.06));
    stops.push(`${h1} 0%`, `${h2} 18%`);
  } else {
    stops.push("transparent 0%", "transparent 18%");
  }

  stops.push("transparent 46%", "transparent 54%");

  if (away.length > 0) {
    const a2 = hexToRgba(away[1] ?? away[0], getKitTintAlpha(away[1] ?? away[0], 0.06));
    const a1 = hexToRgba(away[0], getKitTintAlpha(away[0], 0.1));
    stops.push(`${a2} 82%`, `${a1} 100%`);
  } else {
    stops.push("transparent 82%", "transparent 100%");
  }

  return {
    backgroundImage: `linear-gradient(to right, ${stops.join(", ")})`,
  };
}

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
  const colors = useMemo(() => parseClubColors(clubColors || ''), [clubColors]);
  
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

