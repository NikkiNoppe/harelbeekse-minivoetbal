import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionToken } from "@/lib/authSession";
import { useAuth } from "@/hooks/useAuth";
import {
  profilePollService,
  PROFILE_POLLS_QUERY_KEY,
  type ProfilePollAdmin,
  type ProfilePollRespondentView,
} from "@/services/profilePoll/profilePollService";

const MIN_LOADING_TIME = 250;

interface UseProfilePollsOptions {
  isAdmin: boolean;
  enabled?: boolean;
  enableRealtime?: boolean;
}

export function useProfilePolls({
  isAdmin,
  enabled = true,
  enableRealtime = false,
}: UseProfilePollsOptions) {
  const queryClient = useQueryClient();
  const { authContextReady } = useAuth();
  const hasSession = !!getSessionToken();
  const queryEnabled = enabled && authContextReady && hasSession;

  const query = useQuery({
    queryKey: [...PROFILE_POLLS_QUERY_KEY, isAdmin ? "admin" : "respondent"],
    queryFn: async () => {
      const start = Date.now();
      const data = await profilePollService.getPolls(isAdmin);
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_TIME - elapsed));
      }
      return data;
    },
    enabled: queryEnabled,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: PROFILE_POLLS_QUERY_KEY });
    await query.refetch();
  }, [queryClient, query]);

  useEffect(() => {
    if (!enableRealtime || !queryEnabled) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel("profile-polls-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "application_settings",
          filter: "setting_category=eq.profile_polls",
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: PROFILE_POLLS_QUERY_KEY });
          }, 800);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, queryEnabled, queryClient]);

  const adminPolls = (isAdmin ? query.data : []) as ProfilePollAdmin[] | undefined;
  const respondentPolls = (!isAdmin ? query.data : []) as ProfilePollRespondentView[] | undefined;

  const waitingForAuth = enabled && (!authContextReady || !hasSession);

  const showLoading =
    waitingForAuth ||
    (query.isLoading && !query.data && !query.isPlaceholderData);
  const showEmpty =
    query.isFetched && !query.isPlaceholderData && (query.data?.length ?? 0) === 0;
  const showError = query.isError && query.isFetched && !waitingForAuth;

  return {
    adminPolls: adminPolls ?? [],
    respondentPolls: respondentPolls ?? [],
    isLoading: showLoading,
    isFetching: query.isFetching,
    showEmpty,
    showError,
    error: query.error,
    refresh,
    refetch: query.refetch,
  };
}
