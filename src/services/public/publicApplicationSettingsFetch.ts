import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/config/organization";

export interface PublicApplicationSettingRow {
  id: number;
  setting_category: string;
  setting_name: string;
  setting_value: unknown;
}

export async function fetchPublicApplicationSettings(
  categories?: string[],
  organizationId: number = DEFAULT_ORGANIZATION_ID,
): Promise<PublicApplicationSettingRow[]> {
  const { data, error } = await supabase.rpc("get_public_application_settings", {
    p_categories: categories ?? null,
    p_organization_id: organizationId,
  });

  if (error) {
    console.error("[fetchPublicApplicationSettings] RPC error:", error);
    throw error;
  }

  return (data ?? []) as PublicApplicationSettingRow[];
}

export function findPublicSetting(
  rows: PublicApplicationSettingRow[],
  category: string,
  settingName: string,
): PublicApplicationSettingRow | undefined {
  return rows.find(
    (row) => row.setting_category === category && row.setting_name === settingName,
  );
}
