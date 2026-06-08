import type { ThemeColors } from "@/lib/colorUtils";

const LOGO_SVG_URL = "/images/logos/logo-krc-transparent.svg";

let emblemInnerSvg: string | null = null;
let emblemLoadPromise: Promise<string> | null = null;
let lastFaviconHref: string | null = null;
let lastThemeColor: string | null = null;

async function loadEmblemInner(): Promise<string> {
  if (emblemInnerSvg) return emblemInnerSvg;

  if (!emblemLoadPromise) {
    emblemLoadPromise = fetch(LOGO_SVG_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Logo SVG niet gevonden");
        return response.text();
      })
      .then((svg) => {
        const startMarker = '<g id="Xsvqs8.tif">';
        const start = svg.indexOf(startMarker);
        const svgEnd = svg.lastIndexOf("</svg>");
        const groupEnd = svg.lastIndexOf("</g>", svgEnd);

        if (start === -1 || groupEnd === -1) {
          throw new Error("Embleem niet gevonden in logo SVG");
        }

        emblemInnerSvg = svg
          .slice(start + startMarker.length, groupEnd)
          .replace(/class="cls-2"/g, 'fill="#ffffff"')
          .trim();
        return emblemInnerSvg;
      });
  }

  return emblemLoadPromise;
}

function buildFaviconDataUrl(primary: string, emblemInner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${primary}"/>
  <svg x="3" y="1" width="58" height="62" viewBox="0 0 58 85" preserveAspectRatio="xMidYMid meet">${emblemInner}</svg>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function setMetaContent(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function updateFaviconLinks(href: string) {
  if (lastFaviconHref === href) return;
  lastFaviconHref = href;

  const rels = ["icon", "shortcut icon", "apple-touch-icon"] as const;
  for (const rel of rels) {
    let link = document.querySelector(`link[rel="${rel}"][data-dynamic-theme]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      link.setAttribute("data-dynamic-theme", "true");
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = href;
  }
}

/** Werkt favicon en browser theme-color bij naar het actieve kleurenpalet. */
export async function applyThemeToDocument(theme: ThemeColors): Promise<void> {
  if (typeof document === "undefined") return;

  const primary = theme.primaryBase;

  if (lastThemeColor !== primary) {
    lastThemeColor = primary;
    setMetaContent("theme-color", primary);
    setMetaContent("msapplication-TileColor", primary);
  }

  try {
    const emblemInner = await loadEmblemInner();
    if (!emblemInner) return;
    updateFaviconLinks(buildFaviconDataUrl(primary, emblemInner));
  } catch (error) {
    console.warn("Kon thema-favicon niet bijwerken:", error);
  }
}
