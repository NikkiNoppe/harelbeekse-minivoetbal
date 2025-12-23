import React from "react";
import { AppAlertModal } from "@/components/ui/app-alert-modal";

interface Team {
  team_id: number;
  team_name: string;
}

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onConfirm: () => void;
  loading: boolean;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
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

export default ConfirmDeleteDialog; 