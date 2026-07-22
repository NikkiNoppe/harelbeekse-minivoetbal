import { getEdgeFunctionHeaders } from '@/lib/authSession';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

export type OrganizationBrandingAssetType = 'logo' | 'logo-icon' | 'favicon';

export async function uploadOrganizationBrandingAsset(input: {
  organizationId: number;
  assetType: OrganizationBrandingAssetType;
  file: File;
}): Promise<string> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('organizationId', String(input.organizationId));
  formData.append('assetType', input.assetType);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-organization-branding-asset`, {
    method: 'POST',
    headers: {
      ...getEdgeFunctionHeaders(),
      apikey: SUPABASE_ANON_KEY,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Upload mislukt');
  }

  const publicUrl = typeof data?.publicUrl === 'string' ? data.publicUrl : '';
  if (!publicUrl) {
    throw new Error('Geen publieke URL ontvangen na upload');
  }

  return publicUrl;
}
