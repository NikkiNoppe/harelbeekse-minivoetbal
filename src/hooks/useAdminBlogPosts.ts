import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { blogService } from "@/services";
import { useMinLoadingGate } from "@/hooks/useMinLoadingGate";
import { useOrgQueryScope } from "@/hooks/useOrganization";
import { withOrgQueryKey } from "@/lib/orgQueryKey";

export const ADMIN_BLOG_POSTS_QUERY_KEY = ["adminBlogPosts"] as const;

export const useAdminBlogPosts = () => {
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();

  const query = useQuery({
    queryKey: withOrgQueryKey(ADMIN_BLOG_POSTS_QUERY_KEY, organizationId),
    queryFn: () => blogService.getAllBlogPosts(),
    enabled: orgQueryEnabled,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  const hasData = query.data !== undefined;
  const waitingForData = !hasData && query.isFetching;
  const loadingGate = useMinLoadingGate(waitingForData);

  const isListLoading =
    !loadingGate.timedOut &&
    !hasData &&
    (waitingForData || !loadingGate.minReady);

  const isRefreshing = hasData && query.isFetching && !query.isLoading;

  const displayError = loadingGate.timedOut
    ? new Error("Het laden van blog posts duurt te lang (>5 seconden).")
    : query.error;

  const showError = !!displayError && !hasData && !isListLoading;

  const showEmpty =
    query.isFetched &&
    !query.isPlaceholderData &&
    (query.data?.length ?? 0) === 0 &&
    !isListLoading &&
    !showError;

  return {
    organizationId,
    blogPosts: query.data,
    isListLoading,
    isRefreshing,
    showError,
    showEmpty,
    error: displayError,
    refetch: query.refetch,
    isFetched: query.isFetched,
    isPlaceholderData: query.isPlaceholderData,
  };
};
