import React, { useMemo } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const parseHexColors = (colorString: string): string[] => {
  if (!colorString) return [];

  const getHexFromColor = (color: string): string => {
    if (color.startsWith("#")) return color;
    if (color.startsWith("rgb")) {
      const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
      if (!result) return "#000000";
      const r = parseInt(result[1], 10);
      const g = parseInt(result[2], 10);
      const b = parseInt(result[3], 10);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return "#000000";
  };

  const parts = colorString.split("-").map((p) => p.trim()).filter(Boolean);
  const hexColors = parts.filter(
    (part) => part.startsWith("#") || /^#[0-9A-Fa-f]{6}$/i.test(part),
  );

  if (hexColors.length > 0) {
    return hexColors
      .map((color) => {
        if (color.startsWith("#")) return color;
        if (/^[0-9A-Fa-f]{6}$/i.test(color)) return `#${color}`;
        return getHexFromColor(color);
      })
      .filter(Boolean);
  }

  return parts
    .map((color) => {
      if (color.startsWith("#") || color.startsWith("rgb")) {
        return getHexFromColor(color);
      }
      if (/^[0-9A-Fa-f]{6}$/i.test(color)) return `#${color}`;
      return null;
    })
    .filter((c): c is string => c !== null && c.length > 0);
};

const isLightHex = (hex: string): boolean => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
};

export const getClubColorName = (clubColors?: string | null): string | null => {
  if (!clubColors) return null;
  return clubColors.split("-").find((part) => !part.startsWith("#")) || null;
};

const getBackgroundStyle = (clubColors?: string | null): React.CSSProperties | undefined => {
  if (!clubColors) return undefined;
  const colors = parseHexColors(clubColors);
  if (colors.length === 0) return undefined;
  if (colors.length === 1) return { backgroundColor: colors[0] };
  // Solid second color as base so circle anti-aliasing doesn't leak the first
  // color along the rim of the second half (e.g. cyan fringe on white).
  return {
    backgroundColor: colors[1],
    backgroundImage: `linear-gradient(135deg, ${colors[0]} 50%, transparent 50%)`,
  };
};

const getTrophyIconClass = (clubColors?: string | null): string => {
  const colors = parseHexColors(clubColors || "");
  if (colors.length === 0) return "text-white";

  if (colors.length === 1) {
    return isLightHex(colors[0]) ? "text-gray-800" : "text-white";
  }

  const lightCount = colors.filter(isLightHex).length;
  if (lightCount === colors.length) return "text-gray-800";
  // Mixed light/dark (e.g. yellow–black): white reads better on the dark half
  if (lightCount > 0) return "text-white drop-shadow-sm";
  return "text-white";
};

interface TeamTrophyAvatarProps {
  clubColors?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export const TeamTrophyAvatar: React.FC<TeamTrophyAvatarProps> = ({
  clubColors,
  className,
  size = "md",
}) => {
  const iconClass = useMemo(() => getTrophyIconClass(clubColors), [clubColors]);
  const backgroundStyle = useMemo(() => getBackgroundStyle(clubColors), [clubColors]);

  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className={cn(
        "relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-bold isolate",
        // Subtiele rand + inset ring: maskeert gradient anti-aliasing aan de cirkelrand
        "border border-black/20",
        "shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(0,0,0,0.12)]",
        sizeClasses,
        !clubColors && "bg-primary",
        className,
      )}
      aria-hidden
    >
      {backgroundStyle ? (
        <span
          className="pointer-events-none absolute inset-[1px] overflow-hidden rounded-full"
          style={backgroundStyle}
          aria-hidden
        />
      ) : null}
      <Trophy className={cn(iconSize, "relative z-10", iconClass)} />
    </div>
  );
};
