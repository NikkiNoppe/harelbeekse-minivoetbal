
import React from "react";
import { AppAlertModal, DestructiveConfirmDescription } from "@/components/modals";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
  user?: { username: string };
}

const UserDeleteConfirmModal: React.FC<ConfirmDeleteModalProps> = ({ 
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
      size="sm"
      description={
        <DestructiveConfirmDescription
          message={
            <>
              Weet je zeker dat je{" "}
              <span className="font-semibold text-destructive">{user?.username}</span>{" "}
              permanent wilt verwijderen?
            </>
          }
          details="Alle gebruikersgegevens, teamtoewijzingen en toegangsrechten worden permanent verwijderd."
        />
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
    />
  );
};

export default UserDeleteConfirmModal;
