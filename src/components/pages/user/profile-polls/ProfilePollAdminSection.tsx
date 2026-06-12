import React, { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfilePolls } from "@/hooks/useProfilePolls";
import { profilePollService } from "@/services/profilePoll/profilePollService";
import { CreateProfilePollModal } from "./CreateProfilePollModal";
import { ProfilePollResultsCard } from "./ProfilePollResultsCard";
import { AppAlertModal } from "@/components/modals/base/app-alert-modal";

export interface ProfilePollAdminSectionHandle {
  openCreateModal: () => void;
}

export const ProfilePollAdminSection = forwardRef<ProfilePollAdminSectionHandle>(
  function ProfilePollAdminSection(_props, ref) {
    const { toast } = useToast();
    const {
      adminPolls,
      isLoading,
      isFetching,
      showEmpty,
      showError,
      error,
      refresh,
    } = useProfilePolls({ isAdmin: true, enableRealtime: true });

    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [closingId, setClosingId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useImperativeHandle(ref, () => ({
      openCreateModal: () => setModalOpen(true),
    }));

    const handleCreate = useCallback(
      async (payload: Parameters<typeof profilePollService.createPoll>[0]) => {
        await profilePollService.createPoll(payload);
        toast({
          title: "Poll gelanceerd",
          description: "De poll is zichtbaar voor de doelgroep.",
        });
        await refresh();
      },
      [toast, refresh],
    );

    const handleClose = useCallback(
      async (pollId: number) => {
        setClosingId(pollId);
        try {
          await profilePollService.closePoll(pollId);
          toast({ title: "Poll gesloten" });
          await refresh();
        } catch (err) {
          toast({
            title: "Fout",
            description: err instanceof Error ? err.message : "Kon poll niet sluiten",
            variant: "destructive",
          });
        } finally {
          setClosingId(null);
        }
      },
      [toast, refresh],
    );

    const handleDeleteConfirm = useCallback(async () => {
      if (deleteId == null) return;
      setDeleting(true);
      try {
        await profilePollService.deletePoll(deleteId);
        toast({ title: "Poll verwijderd" });
        setDeleteId(null);
        await refresh();
      } catch (err) {
        toast({
          title: "Fout",
          description: err instanceof Error ? err.message : "Kon poll niet verwijderen",
          variant: "destructive",
        });
      } finally {
        setDeleting(false);
      }
    }, [deleteId, toast, refresh]);

    const activePolls = adminPolls.filter((p) => p.is_active);
    const inactivePolls = adminPolls.filter((p) => !p.is_active);
    const errorMessage =
      error instanceof Error ? error.message : showError ? "Onbekende fout" : null;

    return (
      <>
        <CardContent className="pt-0 space-y-4">
          {isFetching && adminPolls.length > 0 && (
            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Vernieuwen…
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : showError ? (
            <div className="text-center py-6 space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
              <p className="text-sm font-medium">Kon polls niet laden</p>
              {errorMessage && (
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
              )}
              {errorMessage === "Ongeldige sessie" && (
                <p className="text-xs text-muted-foreground">
                  Log opnieuw in en probeer het daarna opnieuw.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => void refresh()}
              >
                Opnieuw proberen
              </Button>
            </div>
          ) : showEmpty ? (
            <div className="text-center py-8 space-y-2">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nog geen profielpolls. Maak een poll aan voor teamverantwoordelijken of
                scheidsrechters.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activePolls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actief ({activePolls.length})
                  </p>
                  {activePolls.map((poll) => (
                    <ProfilePollResultsCard
                      key={poll.id}
                      poll={poll}
                      onClose={handleClose}
                      onDelete={async (id) => setDeleteId(id)}
                      isClosing={closingId === poll.id}
                    />
                  ))}
                </div>
              )}
              {inactivePolls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Afgelopen / gesloten ({inactivePolls.length})
                  </p>
                  {inactivePolls.map((poll) => (
                    <ProfilePollResultsCard
                      key={poll.id}
                      poll={poll}
                      onClose={handleClose}
                      onDelete={async (id) => setDeleteId(id)}
                      isDeleting={deleting && deleteId === poll.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CreateProfilePollModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
        />

        <AppAlertModal
          open={deleteId != null}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Poll verwijderen?"
          description="De poll en alle antwoorden worden permanent verwijderd."
          confirmAction={{
          label: deleting ? "Verwijderen…" : "Verwijderen",
          onClick: () => void handleDeleteConfirm(),
          variant: "destructive",
          loading: deleting,
          }}
          cancelAction={{
            label: "Annuleren",
            onClick: () => setDeleteId(null),
          }}
        />
      </>
    );
  },
);
