import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface ApplicationSettingRow {
  id: number;
  setting_category: string;
  setting_name: string;
  setting_value: unknown;
  updated_at?: string;
}

type ManageArgs = {
  p_operation: "list" | "insert" | "update" | "delete";
  p_category?: string | null;
  p_id?: number | null;
  p_setting_name?: string | null;
  p_setting_value?: unknown;
};

async function callManage(args: ManageArgs) {
  return supabase.rpc("manage_application_settings_for_session", {
    ...getRpcSessionArgs(),
    p_operation: args.p_operation,
    p_category: args.p_category ?? null,
    p_id: args.p_id ?? null,
    p_setting_name: args.p_setting_name ?? null,
    p_setting_value: (args.p_setting_value ?? null) as any,
  } as any);
}

export async function listApplicationSettingsForSession(
  category?: string,
): Promise<ApplicationSettingRow[]> {
  const { data, error } = await callManage({
    p_operation: "list",
    p_category: category ?? null,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as unknown as ApplicationSettingRow[]) : [];
}

export async function insertApplicationSettingForSession(row: {
  setting_category: string;
  setting_name: string;
  setting_value: unknown;
}): Promise<number> {
  const { data, error } = await callManage({
    p_operation: "insert",
    p_category: row.setting_category,
    p_setting_name: row.setting_name,
    p_setting_value: row.setting_value,
  });
  if (error) throw error;
  const result = data as { success?: boolean; id?: number; error?: string };
  if (!result?.success || !result.id) {
    throw new Error(result?.error ?? "Instelling niet opgeslagen");
  }
  return result.id;
}

export async function updateApplicationSettingForSession(
  id: number,
  patch: { setting_name?: string; setting_value?: unknown; setting_category?: string },
): Promise<void> {
  const { data, error } = await callManage({
    p_operation: "update",
    p_id: id,
    p_category: patch.setting_category ?? null,
    p_setting_name: patch.setting_name ?? null,
    p_setting_value: patch.setting_value ?? null,
  });
  if (error) throw error;
  const result = data as { success?: boolean; error?: string };
  if (!result?.success) throw new Error(result?.error ?? "Instelling niet bijgewerkt");
}

export async function deleteApplicationSettingForSession(
  id: number,
  category?: string,
): Promise<void> {
  const { data, error } = await callManage({
    p_operation: "delete",
    p_id: id,
    p_category: category ?? null,
  });
  if (error) throw error;
  const result = data as { success?: boolean; error?: string };
  if (!result?.success) throw new Error(result?.error ?? "Instelling niet verwijderd");
}
