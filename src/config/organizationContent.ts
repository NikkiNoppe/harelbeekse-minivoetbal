/** Publieke paginateksten per organisatie (override via organizations.branding_settings.content). */

export interface AlgemeenPageCopy {
  title: string;
  subtitle: string;
  aboutParagraph: string;
}

export interface ProfileFinancialCopy {
  seasonDepositTarget: number;
  depositDeadlineLabel: string;
  accountHolder: string;
  iban: string;
  seasonDepositNotice: string;
}

export interface OrganizationPublicContent {
  algemeen: AlgemeenPageCopy;
  footerTagline: string;
  profileFinancial: ProfileFinancialCopy;
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
    profileFinancial: {
      seasonDepositTarget: 600,
      depositDeadlineLabel: '15 augustus',
      accountHolder: 'Nikki Noppe',
      iban: 'BE48 6504 6890 7727',
      seasonDepositNotice: '',
    },
  },
  kuurne: {
    algemeen: {
      title: 'Minivoetbal Vereniging Kuurne',
      subtitle: 'Standen, speelschema en uitslagen in Kuurne',
      aboutParagraph:
        'Welkom bij de minivoetbalcompetitie van Kuurne. Op deze site vind je het actuele speelschema, klassementen, uitslagen en alle praktische info over het lopende seizoen.',
    },
    footerTagline: 'Minivoetbalcompetitie in Kuurne.',
    profileFinancial: {
      seasonDepositTarget: 600,
      depositDeadlineLabel: '15 augustus',
      accountHolder: '',
      iban: '',
      seasonDepositNotice:
        'Neem contact op met de organisatie voor stortingsgegevens.',
    },
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

function mergeProfileFinancialCopy(
  base: ProfileFinancialCopy,
  override?: Partial<ProfileFinancialCopy>,
): ProfileFinancialCopy {
  return {
    seasonDepositTarget:
      override?.seasonDepositTarget ?? base.seasonDepositTarget,
    depositDeadlineLabel:
      override?.depositDeadlineLabel?.trim() || base.depositDeadlineLabel,
    accountHolder: override?.accountHolder?.trim() || base.accountHolder,
    iban: override?.iban?.trim() || base.iban,
    seasonDepositNotice:
      override?.seasonDepositNotice?.trim() || base.seasonDepositNotice,
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
        profileFinancial?: Partial<ProfileFinancialCopy>;
      }
    | undefined;

  if (!raw) {
    return base;
  }

  return {
    algemeen: mergeAlgemeenCopy(base.algemeen, raw.algemeen),
    footerTagline: raw.footerTagline?.trim() || base.footerTagline,
    profileFinancial: mergeProfileFinancialCopy(
      base.profileFinancial,
      raw.profileFinancial,
    ),
  };
}
