/**
 * Color utility functions for dynamic theme palette generation.
 * Converts a single hex color into a full 50-900 shade scale using HSL lightness shifting.
 */

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColor {
  base: string;
  bg: string;
  border?: string;
}

export interface ThemeColors {
  primaryBase: string;
  primaryLight: string;
  scale: ColorScale;
  destructive?: SemanticColor;
  success?: SemanticColor;
  warning?: SemanticColor;
  info?: SemanticColor;
}

// Default semantic colors
export const DEFAULT_SEMANTIC: Required<Pick<ThemeColors, 'destructive' | 'success' | 'warning' | 'info'>> = {
  destructive: { base: "#ef4444", bg: "#fee2e2", border: "#f87171" },
  success: { base: "#22c55e", bg: "#dcfce7" },
  warning: { base: "#f59e0b", bg: "#fef3c7" },
  info: { base: "#3b82f6", bg: "#eff6ff" },
};

/** Sport Harelbeke / stad Harelbeke kleurenpalet (sportdienstharelbeke.be) */
export const DEFAULT_THEME: ThemeColors = {
  primaryBase: "#0072b9",
  primaryLight: "#4dbbff",
  scale: {
    50: "#f1f9fd",
    100: "#e3f3fc",
    200: "#c5e7fc",
    300: "#8fd4ff",
    400: "#4dbbff",
    500: "#009dff",
    600: "#0072b9",
    700: "#005285",
    800: "#003252",
    900: "#02121c",
  },
  destructive: DEFAULT_SEMANTIC.destructive,
  success: DEFAULT_SEMANTIC.success,
  warning: { base: "#ffb300", bg: "#fff4d6" },
  info: { base: "#007fff", bg: "#e3f3fc" },
};

/** Kuurne minivoetbal — minivoetbalkuurne.be (donker + geel accent). */
export const KUURNE_THEME: ThemeColors = {
  primaryBase: "#1A1A1A",
  primaryLight: "#FFC107",
  scale: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#FFF8E1",
    300: "#FFE082",
    400: "#FFD54F",
    500: "#FFC107",
    600: "#1A1A1A",
    700: "#141414",
    800: "#0f0f0f",
    900: "#0a0a0a",
  },
  destructive: DEFAULT_SEMANTIC.destructive,
  success: DEFAULT_SEMANTIC.success,
  warning: { base: "#FFC107", bg: "#FFF8E1" },
  info: { base: "#5A8F99", bg: "#E0EFF2" },
};

/** Code-fallback per organisatie-slug (sync met DB-migraties). */
export const ORGANIZATION_THEMES: Record<string, ThemeColors> = {
  harelbeke: DEFAULT_THEME,
  kuurne: KUURNE_THEME,
};

export function normalizeTheme(val: ThemeColors | undefined): ThemeColors {
  if (!val?.primaryBase || !val?.scale) return DEFAULT_THEME;
  if (val.primaryBase.toLowerCase() === "#60368c") return DEFAULT_THEME;
  return {
    ...val,
    destructive: val.destructive ?? DEFAULT_SEMANTIC.destructive,
    success: val.success ?? DEFAULT_SEMANTIC.success,
    warning: val.warning ?? DEFAULT_SEMANTIC.warning,
    info: val.info ?? DEFAULT_SEMANTIC.info,
  };
}

export function resolveOrganizationTheme(
  slug: string,
  options?: {
    brandingTheme?: ThemeColors;
    dbTheme?: ThemeColors;
  },
): ThemeColors {
  const branding = options?.brandingTheme;
  if (branding?.primaryBase && branding?.scale) {
    return normalizeTheme(branding);
  }
  const db = options?.dbTheme;
  if (db?.primaryBase && db?.scale) {
    return normalizeTheme(db);
  }
  return ORGANIZATION_THEMES[slug] ?? DEFAULT_THEME;
}

function setTwRgbTriplet(root: HTMLElement, token: string, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  root.style.setProperty(`--tw-${token}`, `${r} ${g} ${b}`);
}

/** Apply theme colors to CSS custom properties on :root */
export function applyThemeToCSS(theme: ThemeColors): void {
  const root = document.documentElement;
  const normalized = normalizeTheme(theme);
  const [r, g, b] = hexToRgb(normalized.primaryBase);

  root.style.setProperty("--color-primary-base", normalized.primaryBase);
  root.style.setProperty("--color-primary-light", normalized.primaryLight);
  root.style.setProperty("--brand-dark", normalized.primaryBase);
  root.style.setProperty("--brand-light", normalized.primaryLight);

  for (const [key, value] of Object.entries(normalized.scale)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  const opacities = [0.04, 0.07, 0.09, 0.10, 0.12, 0.15, 0.18, 0.25];
  const opacityNames = ["04", "07", "09", "10", "12", "15", "18", "25"];
  opacities.forEach((opacity, i) => {
    root.style.setProperty(
      `--color-shadow-primary-${opacityNames[i]}`,
      `rgba(${r}, ${g}, ${b}, ${opacity})`,
    );
  });

  const semantic = {
    destructive: normalized.destructive ?? DEFAULT_SEMANTIC.destructive,
    success: normalized.success ?? DEFAULT_SEMANTIC.success,
    warning: normalized.warning ?? DEFAULT_SEMANTIC.warning,
    info: normalized.info ?? DEFAULT_SEMANTIC.info,
  };

  for (const [name, colors] of Object.entries(semantic)) {
    root.style.setProperty(`--color-${name}`, colors.base);
    root.style.setProperty(`--color-${name}-dark`, colors.base);
    root.style.setProperty(`--color-${name}-bg`, colors.bg);
    if (colors.border) {
      root.style.setProperty(`--color-${name}-border`, colors.border);
    }
    if (name === "destructive") {
      const [dr, dg, db] = hexToRgb(colors.base);
      root.style.setProperty("--color-shadow-destructive-07", `rgba(${dr}, ${dg}, ${db}, 0.07)`);
      root.style.setProperty("--color-shadow-destructive-15", `rgba(${dr}, ${dg}, ${db}, 0.15)`);
    }
  }

  // Shadcn / Tailwind RGB tokens — anders blijven Harelbeke-waarden uit index.css actief
  root.style.setProperty("--primary", "var(--color-600)");
  root.style.setProperty("--foreground", "var(--color-600)");
  root.style.setProperty("--ring", "var(--color-600)");
  root.style.setProperty("--focus-ring-color", "var(--color-600)");

  setTwRgbTriplet(root, "primary", normalized.scale[600]);
  setTwRgbTriplet(root, "foreground", normalized.scale[600]);
  setTwRgbTriplet(root, "ring", normalized.scale[600]);
  setTwRgbTriplet(root, "secondary", normalized.scale[50]);
  setTwRgbTriplet(root, "secondary-foreground", normalized.scale[600]);
  setTwRgbTriplet(root, "muted", normalized.scale[50]);
  setTwRgbTriplet(root, "muted-foreground", normalized.scale[700]);
  setTwRgbTriplet(root, "accent", normalized.scale[50]);
  setTwRgbTriplet(root, "accent-foreground", normalized.scale[700]);
  setTwRgbTriplet(root, "card-foreground", normalized.scale[600]);
  setTwRgbTriplet(root, "popover-foreground", normalized.scale[600]);
  setTwRgbTriplet(root, "primary-foreground", "#ffffff");
  setTwRgbTriplet(root, "background", "#ffffff");
  setTwRgbTriplet(root, "card", "#ffffff");
  setTwRgbTriplet(root, "popover", "#ffffff");
  setTwRgbTriplet(root, "input", normalized.scale[200]);
}
export function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** Convert HSL to hex */
export function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;

  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convert hex to RGB tuple */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

/** 
 * Generate a full 50-900 color scale from a single hex base color.
 * The base color is mapped to the 600 shade (primary-base).
 */
export function generatePalette(baseHex: string): ColorScale {
  const [h, s] = hexToHsl(baseHex);

  // Lightness targets for each shade level
  const lightnessMap: Record<keyof ColorScale, number> = {
    50: 97,
    100: 94,
    200: 88,
    300: 78,
    400: 65,
    500: 50,
    600: hexToHsl(baseHex)[2], // Keep original lightness for base
    700: Math.max(hexToHsl(baseHex)[2] - 10, 15),
    800: Math.max(hexToHsl(baseHex)[2] - 20, 10),
    900: Math.max(hexToHsl(baseHex)[2] - 30, 6),
  };

  const scale = {} as ColorScale;
  for (const [key, lightness] of Object.entries(lightnessMap)) {
    let adjustedS = s;
    const l = lightness;
    if (l > 90) adjustedS = Math.max(s - 20, 10);
    else if (l > 80) adjustedS = Math.max(s - 10, 15);
    else if (l < 15) adjustedS = Math.max(s - 15, 10);

    scale[key as unknown as keyof ColorScale] = hslToHex(h, adjustedS, l);
  }

  return scale;
}

/** Generate a full ThemeColors object from a base hex */
export function generateThemeFromBase(baseHex: string): ThemeColors {
  const scale = generatePalette(baseHex);
  return {
    primaryBase: baseHex,
    primaryLight: scale[400],
    scale,
    ...DEFAULT_SEMANTIC,
  };
}
