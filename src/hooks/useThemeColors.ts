import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeColors, DEFAULT_THEME, applyThemeToCSS } from "@/lib/colorUtils";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const QUERY_KEY = ["theme-colors"];

async function fetchThemeColors(): Promise<ThemeColors> {
  const { data, error } = await supabase
    .from("application_settings")
    .select("setting_value")
    .eq("setting_category", "theme_colors")
    .eq("setting_name", "global_theme")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return DEFAULT_THEME;

  const val = data.setting_value as unknown as ThemeColors;
  if (!val?.primaryBase || !val?.scale) return DEFAULT_THEME;
  return val;
}

/**
 * Hook that loads theme colors from DB and applies them to CSS variables.
 * Call once at the app root level.
 */
export function useThemeColorsInit() {
  const { data: theme } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchThemeColors,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    applyThemeToCSS(theme ?? DEFAULT_THEME);
  }, [theme]);
}

/**
 * Hook for the settings page to read/write theme colors.
 */
export function useThemeColorsAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: theme, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchThemeColors,
  });

  const saveMutation = useMutation({
    mutationFn: async (newTheme: ThemeColors) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from("application_settings")
        .select("id")
        .eq("setting_category", "theme_colors")
        .eq("setting_name", "global_theme")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("application_settings")
          .update({
            setting_value: newTheme as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("application_settings")
          .insert({
            setting_category: "theme_colors",
            setting_name: "global_theme",
            setting_value: newTheme as unknown as Record<string, unknown>,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, newTheme) => {
      applyThemeToCSS(newTheme);
      queryClient.setQueryData(QUERY_KEY, newTheme);
      toast({ title: "Kleuren opgeslagen", description: "Het kleurenpalet is bijgewerkt." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Kleuren konden niet worden opgeslagen.", variant: "destructive" });
    },
  });

  return {
    theme: theme ?? DEFAULT_THEME,
    isLoading,
    saveTheme: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
