/** Publieke paginateksten per organisatie (override via organizations.branding_settings.content). */

export interface AlgemeenPageCopy {
  title: string;
  subtitle: string;
  aboutParagraph: string;
}

export interface OrganizationPublicContent {
  algemeen: AlgemeenPageCopy;
  footerTagline: string;
}

export const ORGANIZATION_PUBLIC_CONTENT: Record<string, OrganizationPublicContent> = {
  harelbeke: {
    algemeen: {
      title: 'Minivoetbal Harelbeke',
      subtitle: 'De officiële minivoetbalcompetitie van Harelbeke en Bavikhove sinds 1979',
      aboutParagraph:
        'Opgericht in 1979 is de Harelbeekse Minivoetbal Competitie uitgegroeid tot de grootste minivoetbalcompetitie van Harelbeke. Elk seizoen nemen tal van teams uit Harelbeke en omgeving deel.',
    },
    footerTagline: 'Minivoetbalcompetitie sinds 1979.',
  },
  kuurne: {
    algemeen: {
      title: 'Minivoetbal Vereniging Kuurne',
      subtitle: 'Standen, speelschema en uitslagen in Kuurne',
      aboutParagraph:
        'Welkom bij de minivoetbalcompetitie van Kuurne. Op deze site vind je het actuele speelschema, klassementen, uitslagen en alle praktische info over het lopende seizoen.',
    },
    footerTagline: 'Minivoetbalcompetitie in Kuurne.',
  },
};

function mergeAlgemeenCopy(
  base: AlgemeenPageCopy,
  override?: Partial<AlgemeenPageCopy>,
): AlgemeenPageCopy {
  return {
    title: override?.title?.trim() || base.title,
    subtitle: override?.subtitle?.trim() || base.subtitle,
    aboutParagraph: override?.aboutParagraph?.trim() || base.aboutParagraph,
  };
}

export function resolveOrganizationPublicContent(
  slug: string,
  brandingSettings?: Record<string, unknown>,
): OrganizationPublicContent {
  const base =
    ORGANIZATION_PUBLIC_CONTENT[slug] ?? ORGANIZATION_PUBLIC_CONTENT.harelbeke;

  const raw = brandingSettings?.content as
    | {
        algemeen?: Partial<AlgemeenPageCopy>;
        footerTagline?: string;
      }
    | undefined;

  if (!raw) {
    return base;
  }

  return {
    algemeen: mergeAlgemeenCopy(base.algemeen, raw.algemeen),
    footerTagline: raw.footerTagline?.trim() || base.footerTagline,
  };
}
