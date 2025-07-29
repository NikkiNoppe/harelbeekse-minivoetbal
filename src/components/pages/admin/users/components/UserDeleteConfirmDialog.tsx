
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal">
        <DialogHeader>
          <DialogTitle className="modal__title">
            Gebruiker permanent verwijderen
          </DialogTitle>
          <DialogDescription className="sr-only">
            Bevestig het permanent verwijderen van de gebruiker
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-purple-dark font-medium">
              Weet je zeker dat je de gebruiker <span className="font-bold">"{user?.username}"</span> permanent wilt verwijderen?
            </p>
            <p className="text-sm text-red-600 mt-3 font-medium">
              ⚠️ Deze actie is onomkeerbaar en kan niet ongedaan worden gemaakt.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Alle gebruikersgegevens, teamtoewijzingen en toegangsrechten worden permanent verwijderd.
            </p>
          </div>
          
          <div className="modal__actions">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn--danger"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                "Permanent verwijderen"
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn--secondary"
              disabled={isDeleting}
            >
              Annuleren
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDeleteConfirmDialog;
