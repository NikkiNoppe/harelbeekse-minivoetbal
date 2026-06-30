import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ThemeColors,
  DEFAULT_THEME,
  applyThemeToCSS,
  normalizeTheme,
  resolveOrganizationTheme,
} from "@/lib/colorUtils";
import { applyThemeToDocument } from "@/lib/themeDocument";
import {
  insertApplicationSettingForSession,
  listApplicationSettingsForSession,
  updateApplicationSettingForSession,
} from "@/services/core/applicationSettingsSessionFetch";
import {
  fetchPublicApplicationSettings,
  findPublicSetting,
} from "@/services/public/publicApplicationSettingsFetch";
import { useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOrgQueryScope, useOrganization } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { parseBrandingSettings } from "@/types/branding";

const QUERY_KEY_BASE = ["theme-colors"] as const;

async function fetchThemeColors(
  organizationId: number,
  organizationSlug: string,
  brandingTheme?: ThemeColors,
): Promise<ThemeColors> {
  let dbTheme: ThemeColors | undefined;

  try {
    const rows = await fetchPublicApplicationSettings(
      ["theme_colors"],
      organizationId,
    );
    const row = findPublicSetting(rows, "theme_colors", "global_theme");
    if (row?.setting_value) {
      dbTheme = row.setting_value as unknown as ThemeColors;
    }
  } catch (error) {
    console.warn("[fetchThemeColors] RPC mislukt, gebruik slug-fallback:", error);
  }

  return resolveOrganizationTheme(organizationSlug, {
    brandingTheme,
    dbTheme,
  });
}

/**
 * Hook that loads theme colors from DB and applies them to CSS variables.
 * Call once at the app root level (inside OrganizationProvider).
 */
export function useThemeColorsInit() {
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const { organization, organizationSlug } = useOrganization();

  const brandingTheme = useMemo(
    () =>
      organization
        ? parseBrandingSettings(organization.brandingSettings).themeColors
        : undefined,
    [organization],
  );

  const slugFallback = useMemo(
    () => resolveOrganizationTheme(organizationSlug, { brandingTheme }),
    [organizationSlug, brandingTheme],
  );

  const { data: theme } = useQuery({
    queryKey: withOrgQueryKey(
      [...QUERY_KEY_BASE, organizationSlug],
      organizationId,
    ),
    queryFn: () =>
      fetchThemeColors(organizationId!, organizationSlug, brandingTheme),
    enabled: orgQueryEnabled,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: slugFallback,
  });

  useEffect(() => {
    if (!orgQueryEnabled) return;
    const activeTheme = theme ?? slugFallback;
    applyThemeToCSS(activeTheme);
    void applyThemeToDocument(activeTheme);
  }, [theme, slugFallback, organizationId, orgQueryEnabled]);
}

/**
 * Hook for the settings page to read/write theme colors.
 */
export function useThemeColorsAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();
  const { organization, organizationSlug } = useOrganization();
  const brandingTheme = organization
    ? parseBrandingSettings(organization.brandingSettings).themeColors
    : undefined;
  const queryKey = withOrgQueryKey(
    [...QUERY_KEY_BASE, organizationSlug],
    organizationId,
  );

  const { data: theme, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchThemeColors(organizationId!, organizationSlug, brandingTheme),
    enabled: orgQueryEnabled,
  });

  const saveMutation = useMutation({
    mutationFn: async (newTheme: ThemeColors) => {
      const rows = await listApplicationSettingsForSession("theme_colors");
      const existing = rows.find((row) => row.setting_name === "global_theme");

      if (existing) {
        await updateApplicationSettingForSession(existing.id, {
          setting_value: JSON.parse(JSON.stringify(newTheme)),
          setting_category: "theme_colors",
        });
      } else {
        await insertApplicationSettingForSession({
          setting_category: "theme_colors",
          setting_name: "global_theme",
          setting_value: JSON.parse(JSON.stringify(newTheme)),
        });
      }
    },
    onSuccess: (_, newTheme) => {
      applyThemeToCSS(normalizeTheme(newTheme));
      void applyThemeToDocument(normalizeTheme(newTheme));
      queryClient.setQueryData(queryKey, newTheme);
      toast({ title: "Kleuren opgeslagen", description: "Het kleurenpalet is bijgewerkt." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Kleuren konden niet worden opgeslagen.", variant: "destructive" });
    },
  });

  return {
    theme: theme ?? resolveOrganizationTheme(organizationSlug, { brandingTheme }),
    isLoading,
    saveTheme: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
