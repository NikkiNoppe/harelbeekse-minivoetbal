import type { ThemeColors } from '@/lib/colorUtils';

export interface OrganizationBrandingMeta {
  defaultTitle?: string;
  defaultDescription?: string;
}

export interface OrganizationExternalLink {
  label: string;
  url: string;
}

export interface OrganizationBranding {
  displayName: string;
  shortName: string;
  siteUrl: string;
  hostnames?: string[];
  logoPath: string;
  logoIconPath: string;
  faviconPath: string;
  themeColors?: ThemeColors;
  meta?: OrganizationBrandingMeta;
  links?: OrganizationExternalLink[];
}

export const DEFAULT_BRANDING: OrganizationBranding = {
  displayName: 'Harelbeekse Minivoetbal Competitie',
  shortName: 'Minivoetbal',
  siteUrl: 'https://harelbekeminivoetbal.be',
  logoPath: '/images/logos/minivoetbal-text.png',
  logoIconPath: '/images/logos/minivoetbal-icon.png',
  faviconPath: '/favicon.ico',
  meta: {
    defaultTitle: 'Minivoetbal Harelbeke | Competitie, standen & uitslagen',
    defaultDescription:
      'Nieuws en info over de Harelbeekse Minivoetbal Competitie.',
  },
};

export function parseBrandingSettings(
  raw: Record<string, unknown> | undefined,
): OrganizationBranding {
  if (!raw || Object.keys(raw).length === 0) {
    return DEFAULT_BRANDING;
  }

  const meta = raw.meta as OrganizationBrandingMeta | undefined;
  const rawLinks = raw.links;

  let links: OrganizationExternalLink[] | undefined;
  if (Array.isArray(rawLinks)) {
    links = rawLinks
      .filter(
        (item): item is OrganizationExternalLink =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as OrganizationExternalLink).label === 'string' &&
          typeof (item as OrganizationExternalLink).url === 'string',
      )
      .map((item) => ({
        label: item.label.trim(),
        url: item.url.trim(),
      }))
      .filter((item) => item.label && item.url);
  }

  return {
    displayName:
      typeof raw.displayName === 'string'
        ? raw.displayName
        : DEFAULT_BRANDING.displayName,
    shortName:
      typeof raw.shortName === 'string'
        ? raw.shortName
        : DEFAULT_BRANDING.shortName,
    siteUrl:
      typeof raw.siteUrl === 'string' ? raw.siteUrl : DEFAULT_BRANDING.siteUrl,
    hostnames: Array.isArray(raw.hostnames)
      ? (raw.hostnames as string[])
      : DEFAULT_BRANDING.hostnames,
    logoPath:
      typeof raw.logoPath === 'string'
        ? raw.logoPath
        : DEFAULT_BRANDING.logoPath,
    logoIconPath:
      typeof raw.logoIconPath === 'string'
        ? raw.logoIconPath
        : DEFAULT_BRANDING.logoIconPath,
    faviconPath:
      typeof raw.faviconPath === 'string'
        ? raw.faviconPath
        : DEFAULT_BRANDING.faviconPath,
    themeColors: raw.themeColors as ThemeColors | undefined,
    meta: {
      defaultTitle: meta?.defaultTitle ?? DEFAULT_BRANDING.meta?.defaultTitle,
      defaultDescription:
        meta?.defaultDescription ?? DEFAULT_BRANDING.meta?.defaultDescription,
    },
    links,
  };
}
