import type { ThemeColors } from "@/lib/colorUtils";

let lastThemeColor: string | null = null;

function setMetaContent(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/** Werkt browser theme-color bij naar het actieve kleurenpalet. Favicon is statisch (PNG-embleem). */
export async function applyThemeToDocument(theme: ThemeColors): Promise<void> {
  if (typeof document === "undefined") return;

  const primary = theme.primaryBase;
  if (lastThemeColor === primary) return;
  lastThemeColor = primary;

  setMetaContent("theme-color", primary);
  setMetaContent("msapplication-TileColor", primary);
}

