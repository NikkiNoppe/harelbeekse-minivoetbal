import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services";
import { useMinLoadingGate } from "@/hooks/useMinLoadingGate";

export const ADMIN_NOTIFICATIONS_QUERY_KEY = ["adminNotifications"] as const;
export const NOTIFICATION_USERS_QUERY_KEY = ["notificationUsers"] as const;

export const useAdminNotifications = () => {
  const notificationsQuery = useQuery({
    queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationService.getAllNotifications(),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  const usersQuery = useQuery({
    queryKey: NOTIFICATION_USERS_QUERY_KEY,
    queryFn: () => notificationService.getAllUsers(),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });

  const hasNotifications = notificationsQuery.data !== undefined;
  const hasUsers = usersQuery.data !== undefined;
  const waitingForNotifications = !hasNotifications && notificationsQuery.isFetching;
  const waitingForUsers = hasNotifications && !hasUsers && usersQuery.isFetching;

  const notificationsGate = useMinLoadingGate(waitingForNotifications);
  const usersGate = useMinLoadingGate(waitingForUsers);

  const isListLoading =
    (!notificationsGate.timedOut &&
      !hasNotifications &&
      (waitingForNotifications || !notificationsGate.minReady)) ||
    (!usersGate.timedOut &&
      hasNotifications &&
      !hasUsers &&
      (waitingForUsers || !usersGate.minReady));

  const isRefreshing =
    (hasNotifications && notificationsQuery.isFetching && !notificationsQuery.isLoading) ||
    (hasUsers && usersQuery.isFetching && !usersQuery.isLoading);

  const displayError = notificationsGate.timedOut
    ? new Error("Het laden van berichten duurt te lang (>5 seconden).")
    : usersGate.timedOut
      ? new Error("Het laden van gebruikers duurt te lang (>5 seconden).")
      : notificationsQuery.error || usersQuery.error;

  const showError = !!displayError && !hasNotifications && !isListLoading;

  const showEmpty =
    notificationsQuery.isFetched &&
    !notificationsQuery.isPlaceholderData &&
    (notificationsQuery.data?.length ?? 0) === 0 &&
    !isListLoading &&
    !showError;

  const refetch = async () => {
    await Promise.all([notificationsQuery.refetch(), usersQuery.refetch()]);
  };

  return {
    notifications: notificationsQuery.data,
    users: usersQuery.data,
    isListLoading,
    isRefreshing,
    showError,
    showEmpty,
    error: displayError,
    refetch,
    isFetched: notificationsQuery.isFetched,
    isPlaceholderData: notificationsQuery.isPlaceholderData,
  };
};
