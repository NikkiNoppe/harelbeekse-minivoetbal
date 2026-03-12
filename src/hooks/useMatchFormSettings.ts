import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MatchFormSettings {
  lock_minutes_before: number;
  allow_late_submission: boolean;
  late_penalty_amount: number;
  late_penalty_note: string;
}

const DEFAULT_SETTINGS: MatchFormSettings = {
  lock_minutes_before: 5,
  allow_late_submission: false,
  late_penalty_amount: 5.0,
  late_penalty_note: "⚠️ BOETE: Wedstrijdblad te laat ingevuld",
};

async function fetchMatchFormSettings(): Promise<MatchFormSettings> {
  const { data, error } = await supabase
    .from("application_settings")
    .select("setting_value")
    .eq("setting_category", "match_form_settings")
    .eq("setting_name", "lock_rules")
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.warn("Could not fetch match form settings, using defaults");
    return DEFAULT_SETTINGS;
  }

  const val = data.setting_value as Record<string, unknown>;
  return {
    lock_minutes_before: (val.lock_minutes_before as number) ?? DEFAULT_SETTINGS.lock_minutes_before,
    allow_late_submission: (val.allow_late_submission as boolean) ?? DEFAULT_SETTINGS.allow_late_submission,
    late_penalty_amount: (val.late_penalty_amount as number) ?? DEFAULT_SETTINGS.late_penalty_amount,
    late_penalty_note: (val.late_penalty_note as string) ?? DEFAULT_SETTINGS.late_penalty_note,
  };
}

export function useMatchFormSettings() {
  return useQuery({
    queryKey: ["match-form-settings"],
    queryFn: fetchMatchFormSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export { DEFAULT_SETTINGS as MATCH_FORM_DEFAULTS };
