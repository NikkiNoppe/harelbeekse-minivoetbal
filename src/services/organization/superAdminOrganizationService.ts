import { supabase } from '@/integrations/supabase/client';
import { getRpcSessionArgs, getSessionToken } from '@/lib/authSession';

export async function setSuperAdminActingOrganization(
  organizationId: number,
  sessionToken?: string,
): Promise<boolean> {
  const token = sessionToken ?? getSessionToken();
  if (!token) {
    console.error('set_super_admin_acting_organization: geen sessietoken');
    return false;
  }

  const { data, error } = await supabase.rpc(
    'set_super_admin_acting_organization',
    {
      p_session_token: token,
      p_organization_id: organizationId,
    },
  );

  if (error) {
    console.error('set_super_admin_acting_organization:', error.message);
    return false;
  }

  return data === true;
}

export interface UpsertOrganizationResult {
  success: boolean;
  error?: string;
  id?: number;
  slug?: string;
}

export async function upsertOrganizationForSuperAdmin(input: {
  organizationId: number;
  name: string;
  slug: string;
  brandingSettings: Record<string, unknown>;
}): Promise<UpsertOrganizationResult> {
  const { data, error } = await supabase.rpc(
    'upsert_organization_for_super_admin',
    {
      ...getRpcSessionArgs(),
      p_organization_id: input.organizationId,
      p_name: input.name,
      p_slug: input.slug,
      p_branding_settings: input.brandingSettings,
    },
  );

  if (error) {
    console.error('upsert_organization_for_super_admin:', error.message);
    return { success: false, error: error.message };
  }

  const result = data as {
    success?: boolean;
    error?: string;
    id?: number;
    slug?: string;
  };

  if (!result?.success) {
    return {
      success: false,
      error: result?.error ?? 'Opslaan mislukt',
    };
  }

  return {
    success: true,
    id: result.id,
    slug: result.slug,
  };
}
