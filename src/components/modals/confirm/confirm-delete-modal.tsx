import React from "react";
import { AppAlertModal } from "@/components/modals/base/app-alert-modal";

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
      title="Team verwijderen"
      description={
        <div className="text-center">
          Weet je zeker dat je <strong>{team?.team_name}</strong> wilt verwijderen?
          <br />
          Deze actie kan niet ongedaan worden gemaakt.
        </div>
      }
      confirmAction={{
        label: loading ? "Verwijderen..." : "Verwijderen",
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
      size="sm"
    />
  );
};

