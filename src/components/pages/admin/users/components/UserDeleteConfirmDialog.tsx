
import React from "react";
import { AppAlertModal } from "@/components/ui/app-alert-modal";
import { Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
  user?: { username: string };
}

const UserDeleteConfirmDialog: React.FC<ConfirmDeleteDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirmDelete,
  isDeleting,
  user
}) => {
  const handleDelete = () => {
    onConfirmDelete();
    onOpenChange(false);
  };

  return (
    <AppAlertModal
      open={open}
      onOpenChange={onOpenChange}
      title="Gebruiker permanent verwijderen"
      description={
        <div className="space-y-3 text-center">
          <p className="text-purple-dark font-medium">
            Weet je zeker dat je de gebruiker <span className="font-bold">"{user?.username}"</span> permanent wilt verwijderen?
          </p>
          <p className="text-sm text-red-600 font-medium">
            ⚠️ Deze actie is onomkeerbaar en kan niet ongedaan worden gemaakt.
          </p>
          <p className="text-xs text-gray-600">
            Alle gebruikersgegevens, teamtoewijzingen en toegangsrechten worden permanent verwijderd.
          </p>
        </div>
      }
      confirmAction={{
        label: isDeleting ? "Verwijderen..." : "Permanent verwijderen",
        onClick: handleDelete,
        variant: "destructive",
        disabled: isDeleting,
        loading: isDeleting,
      }}
      cancelAction={{
        label: "Annuleren",
        onClick: () => onOpenChange(false),
        disabled: isDeleting,
      }}
      size="md"
    />
  );
};

export default UserDeleteConfirmDialog;
