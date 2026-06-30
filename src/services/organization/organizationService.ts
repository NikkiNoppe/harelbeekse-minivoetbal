import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_ORGANIZATION_ID,
  DEFAULT_ORGANIZATION_SLUG,
} from '@/config/organization';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  brandingSettings: Record<string, unknown>;
}

type OrganizationRow = {
  id: number;
  name: string;
  slug: string;
  branding_settings: Record<string, unknown> | null;
};

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brandingSettings: row.branding_settings ?? {},
  };
}

export async function fetchOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, branding_settings')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[fetchOrganizationBySlug]', error);
    throw error;
  }

  return data ? mapOrganization(data as OrganizationRow) : null;
}

export async function fetchOrganizationById(
  id: number,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, branding_settings')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[fetchOrganizationById]', error);
    throw error;
  }

  return data ? mapOrganization(data as OrganizationRow) : null;
}

export async function fetchAllOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, branding_settings')
    .order('id', { ascending: true });

  if (error) {
    console.error('[fetchAllOrganizations]', error);
    throw error;
  }

  return (data ?? []).map((row) => mapOrganization(row as OrganizationRow));
}

export interface ResolveOrganizationInput {
  slugFromUrl?: string | null;
  userOrganizationId?: number;
}

/**
 * @deprecated Gebruik resolveOrganizationFromHostname() — hostname is bron van waarheid.
 */
export async function resolveActiveOrganization(
  input: ResolveOrganizationInput,
): Promise<Organization> {
  const { resolveOrganizationFromHostname } = await import(
    '@/services/organization/resolveOrganization'
  );
  return resolveOrganizationFromHostname();
}
