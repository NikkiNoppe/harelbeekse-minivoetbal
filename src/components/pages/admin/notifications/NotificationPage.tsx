import React, { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { notificationService, type Notification } from "@/services/notificationService";
import {
  ADMIN_NOTIFICATIONS_QUERY_KEY,
  NOTIFICATION_USERS_QUERY_KEY,
  useAdminNotifications,
} from "@/hooks/useAdminNotifications";
import { useBranding } from "@/hooks/useBranding";
import { withOrgQueryKey } from "@/lib/orgQueryKey";
import { PageHeader } from "@/components/layout";
import { Plus, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { NotificationFormModal } from "@/components/modals";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";
import NotificationList, {
  isNotificationActive,
  type NotificationTypeFilter,
} from "./components/NotificationList";

type TargetMode = "roles" | "users";

interface FormData {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  target_roles: string[];
  target_users: number[];
  start_date: string;
  end_date: string;
  send_email: boolean;
}

const DEFAULT_FORM_DATA: FormData = {
  title: "",
  message: "",
  type: "info",
  target_roles: [],
  target_users: [],
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  send_email: false,
};

const NotificationPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const branding = useBranding();
  const {
    organizationId,
    notifications = [],
    users = [],
    isListLoading,
    isRefreshing,
    showError,
    error,
    refetch,
  } = useAdminNotifications();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [initialFormData, setInitialFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [initialTargetMode, setInitialTargetMode] = useState<TargetMode>("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: withOrgQueryKey(ADMIN_NOTIFICATIONS_QUERY_KEY, organizationId),
    });
    await queryClient.invalidateQueries({
      queryKey: withOrgQueryKey(NOTIFICATION_USERS_QUERY_KEY, organizationId),
    });
    await refetch();
  }, [queryClient, organizationId, refetch]);

  const activeCount = useMemo(
    () => notifications.filter((notification) => isNotificationActive(notification)).length,
    [notifications],
  );

  const roleTargetCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          (notification.setting_value.target_roles?.length ?? 0) > 0 &&
          (notification.setting_value.target_users?.length ?? 0) === 0,
      ).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return notifications.filter((notification) => {
      const sv = notification.setting_value;
      const matchesSearch =
        !normalizedSearch ||
        (sv.title?.toLowerCase().includes(normalizedSearch) ?? false) ||
        sv.message.toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === "all" || sv.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [notifications, searchTerm, typeFilter]);

  const resetForm = useCallback(() => {
    setEditingNotification(null);
    setInitialFormData(DEFAULT_FORM_DATA);
    setInitialTargetMode("roles");
  }, []);

  const handleOpenNew = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(
    async (formData: FormData, targetMode: TargetMode) => {
      try {
        let emailSentCount = editingNotification?.setting_value.email_sent_count ?? 0;
        let emailSentAt = editingNotification?.setting_value.email_sent_at;

        if (formData.send_email) {
          const emailResult = await notificationService.sendAdminMessageEmails({
            title: formData.title || undefined,
            message: formData.message,
            target_roles: targetMode === "roles" ? formData.target_roles : [],
            target_user_ids: targetMode === "users" ? formData.target_users : [],
          });

          if (emailResult.queued === 0) {
            throw new Error(
              emailResult.totalRecipients === 0
                ? "Geen ontvangers met een e-mailadres gevonden."
                : "Geen e-mails verstuurd (onderdrukt of mislukt).",
            );
          }

          emailSentCount = emailResult.queued;
          emailSentAt = new Date().toISOString();
        }

        const notificationData = {
          setting_category: "admin_messages",
          setting_name: editingNotification
            ? editingNotification.setting_name
            : `message_${Date.now()}`,
          setting_value: {
            title: formData.title || undefined,
            message: formData.message,
            type: formData.type,
            target_roles: targetMode === "roles" ? formData.target_roles : [],
            target_users: targetMode === "users" ? formData.target_users : [],
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            send_email: formData.send_email,
            email_sent_at:
              formData.send_email && emailSentAt
                ? emailSentAt
                : editingNotification?.setting_value.email_sent_at ?? null,
            email_sent_count:
              formData.send_email && emailSentAt
                ? emailSentCount
                : editingNotification?.setting_value.email_sent_count ?? 0,
          },
        };

        if (editingNotification) {
          await notificationService.updateNotification(editingNotification.id, notificationData);
          toast({
            title: "Opgeslagen",
            description: formData.send_email
              ? `Bericht bijgewerkt · ${emailSentCount} e-mail${emailSentCount === 1 ? "" : "s"} verstuurd`
              : "Bericht bijgewerkt",
          });
        } else {
          await notificationService.createNotification(notificationData);
          toast({
            title: "Aangemaakt",
            description: formData.send_email
              ? `Bericht aangemaakt · ${emailSentCount} e-mail${emailSentCount === 1 ? "" : "s"} verstuurd`
              : "Bericht aangemaakt",
          });
        }

        await refreshData();
        handleDialogClose();
      } catch (err) {
        console.error("Error saving notification:", err);
        toast({
          title: "Fout",
          description: err instanceof Error ? err.message : "Kon bericht niet opslaan",
          variant: "destructive",
        });
        throw err;
      }
    },
    [editingNotification, toast, refreshData, handleDialogClose],
  );

  const handleEdit = useCallback((notification: Notification) => {
    setEditingNotification(notification);
    const sv = notification.setting_value;

    let detectedTargetMode: TargetMode = "roles";
    if (sv.target_users && sv.target_users.length > 0) {
      detectedTargetMode = "users";
    }

    setInitialTargetMode(detectedTargetMode);
    setInitialFormData({
      title: sv.title || "",
      message: sv.message,
      type: sv.type as FormData["type"],
      target_roles: sv.target_roles || [],
      target_users: sv.target_users || [],
      start_date: sv.start_date || "",
      end_date: sv.end_date || "",
      send_email: sv.send_email === true,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((notification: Notification) => {
    setDeleteTarget(notification);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await notificationService.deleteNotification(deleteTarget.id);
      toast({ title: "Verwijderd", description: "Bericht verwijderd" });
      await refreshData();
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast({
        title: "Fout",
        description: "Kon bericht niet verwijderen",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, toast, refreshData]);

  const addButton = (
    <Button
      type="button"
      onClick={handleOpenNew}
      className="min-h-[44px] w-full sm:w-auto"
      aria-label="Nieuw bericht aanmaken"
    >
      <Plus className="h-4 w-4" />
      Nieuw bericht
    </Button>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
      <PageHeader
        title="Berichten"
        subtitle={`Beheer berichten voor ${branding.displayName} (${notifications.length} bericht${notifications.length === 1 ? "" : "en"})`}
        rightAction={
          isRefreshing && !isListLoading ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Vernieuwen…
            </span>
          ) : undefined
        }
      />

      {showError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {error instanceof Error ? error.message : "Kon berichten niet laden."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Opnieuw proberen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!showError && (
        <NotificationList
          notifications={filteredNotifications}
          users={users}
          loading={isListLoading}
          isRefreshing={isRefreshing}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          addButton={addButton}
          totalCount={notifications.length}
          activeCount={activeCount}
          roleTargetCount={roleTargetCount}
        />
      )}

      <NotificationFormModal
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        initialData={initialFormData}
        initialTargetMode={initialTargetMode}
        isEditing={!!editingNotification}
        users={users}
        teams={[]}
      />

      <AppAlertModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Bericht verwijderen"
        description={
          <DestructiveConfirmDescription message="Weet je zeker dat je dit bericht wilt verwijderen?" />
        }
        confirmAction={{
          label: isDeleting ? "Verwijderen…" : "Verwijderen",
          onClick: () => void handleDelete(),
          variant: "destructive",
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setDeleteTarget(null),
        }}
      />
    </div>
  );
};

export default NotificationPage;
