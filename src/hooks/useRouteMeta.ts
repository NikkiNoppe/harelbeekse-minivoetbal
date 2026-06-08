import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getRouteMeta } from "@/config/routes";
import { NOINDEX_PATHS, SITE_URL } from "@/config/site";

const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex, nofollow";

const UTILITY_PAGE_TITLES: Record<string, string> = {
  "/reset-password": "Wachtwoord resetten",
  "/unsubscribe": "Afmelden voor e-mails",
};

function upsertMeta(selector: string, create: () => HTMLElement, update: (el: HTMLElement) => void) {
  let el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  update(el);
}

function upsertMetaName(name: string, content: string) {
  upsertMeta(
    `meta[name="${name}"]`,
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      return meta;
    },
    (el) => {
      (el as HTMLMetaElement).content = content;
    },
  );
}

function upsertMetaProperty(property: string, content: string) {
  upsertMeta(
    `meta[property="${property}"]`,
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      return meta;
    },
    (el) => {
      (el as HTMLMetaElement).content = content;
    },
  );
}

function upsertCanonical(href: string) {
  upsertMeta(
    'link[rel="canonical"]',
    () => {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      return link;
    },
    (el) => {
      (el as HTMLLinkElement).href = href;
    },
  );
}

/**
 * Hook to update document title, meta tags and canonical URL based on current route.
 */
export const useRouteMeta = () => {
  const location = useLocation();
  const meta = getRouteMeta(location.pathname);
  const isNoIndex = NOINDEX_PATHS.includes(location.pathname as (typeof NOINDEX_PATHS)[number]);
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  useEffect(() => {
    if (isNoIndex) {
      const utilityTitle = UTILITY_PAGE_TITLES[location.pathname];
      document.title = utilityTitle
        ? `${utilityTitle} - Harelbeekse Minivoetbal`
        : "Harelbeekse Minivoetbal";
      upsertMetaName("robots", NOINDEX_ROBOTS);
      upsertCanonical(canonicalUrl);
      return;
    }

    upsertMetaName("robots", DEFAULT_ROBOTS);

    if (meta) {
      const pageTitle = `${meta.title} - Harelbeekse Minivoetbal`;
      document.title = pageTitle;

      upsertMetaName("description", meta.description);
      upsertMetaProperty("og:title", pageTitle);
      upsertMetaProperty("og:description", meta.description);
      upsertMetaProperty("og:url", canonicalUrl);
      upsertMetaName("twitter:title", pageTitle);
      upsertMetaName("twitter:description", meta.description);
    } else {
      document.title = "Harelbeekse Minivoetbal";
    }

    upsertCanonical(canonicalUrl);
  }, [meta, location.pathname, canonicalUrl, isNoIndex]);
};
