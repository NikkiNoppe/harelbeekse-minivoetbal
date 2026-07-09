import React from "react";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";

interface Team {
  team_id: number;
  team_name: string;
}

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onConfirm: () => void;
  loading: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onOpenChange,
  team,
  onConfirm,
  loading
}) => {
  return (
    <AppAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title="Team permanent verwijderen"
      size="sm"
      description={
        <DestructiveConfirmDescription
          message={
            <>
              Weet je zeker dat je{" "}
              <span className="font-semibold text-destructive">{team?.team_name}</span>{" "}
              permanent wilt verwijderen?
            </>
          }
          details={
            <ul className="list-disc space-y-1 pl-5">
              <li>Alle teamgegevens worden permanent verwijderd</li>
              <li>Alle spelers gekoppeld aan dit team worden ook verwijderd</li>
              <li>Wedstrijdhistorie en statistieken kunnen worden beïnvloed</li>
            </ul>
          }
        />
      }
      confirmAction={{
        label: loading ? "Verwijderen..." : "Ja, permanent verwijderen",
        onClick: onConfirm,
        variant: "destructive",
        disabled: loading,
        loading: loading,
      }}
      cancelAction={{
        label: "Annuleren",
        onClick: () => onOpenChange(false),
        disabled: loading,
      }}
    />
  );
};
