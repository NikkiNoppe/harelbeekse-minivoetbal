/** Default tenant — Harelbeek Minivoetbal (backward compatible). */
export const DEFAULT_ORGANIZATION_ID = 1;
export const DEFAULT_ORGANIZATION_SLUG = 'harelbeke';

/** Bekende tenant-slugs (code-thema + hostname-mapping). */
export const KNOWN_ORGANIZATION_SLUGS = ['harelbeke', 'kuurne'] as const;

export type KnownOrganizationSlug = (typeof KNOWN_ORGANIZATION_SLUGS)[number];

export function isKnownOrganizationSlug(
  slug: string | null | undefined,
): slug is KnownOrganizationSlug {
  return (
    !!slug &&
    (KNOWN_ORGANIZATION_SLUGS as readonly string[]).includes(slug)
  );
}

/** URL query param voor publieke tenant-selectie (?org=harelbeke). */
export const ORGANIZATION_URL_PARAM = 'org';
