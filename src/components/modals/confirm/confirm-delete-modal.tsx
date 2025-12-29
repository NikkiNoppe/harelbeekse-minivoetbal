import React from "react";
import { AppAlertModal } from "@/components/modals/base/app-alert-modal";
import { AlertTriangle } from "lucide-react";

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
      description={
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">
              Weet je zeker dat je <span className="font-bold text-red-600">{team?.team_name}</span> permanent wilt verwijderen?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left space-y-1.5">
              <p className="text-sm font-medium text-red-800">
                ⚠️ Deze actie is onomkeerbaar!
              </p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>Alle teamgegevens worden permanent verwijderd</li>
                <li>Alle spelers gekoppeld aan dit team worden ook verwijderd</li>
                <li>Wedstrijdhistorie en statistieken kunnen worden beïnvloed</li>
                <li>Deze actie kan niet ongedaan worden gemaakt</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Controleer zorgvuldig voordat je doorgaat.
            </p>
          </div>
        </div>
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
      size="md"
    />
  );
};

