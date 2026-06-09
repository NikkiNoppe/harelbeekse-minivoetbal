import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export async function fetchAdminDatabaseBackupForSession(): Promise<Record<string, unknown[]>> {
  const { data, error } = await supabase.rpc("get_admin_database_backup_for_session", getRpcSessionArgs());
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data as Record<string, unknown[]>;
}
