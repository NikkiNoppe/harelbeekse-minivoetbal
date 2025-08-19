import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="modal">
        <AlertDialogHeader>
          <AlertDialogTitle className="modal__title">Team verwijderen</AlertDialogTitle>
          <div className="text-center">
            Weet je zeker dat je <strong>{team?.team_name}</strong> wilt verwijderen?
            <br />
            Deze actie kan niet ongedaan worden gemaakt.
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="modal__actions">
          <AlertDialogCancel disabled={loading} className="btn btn--secondary flex-1">
            Annuleren
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="btn btn--danger flex-1"
          >
            {loading ? "Verwijderen..." : "Verwijderen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteDialog; 