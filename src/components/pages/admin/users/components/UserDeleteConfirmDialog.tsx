
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
import { X } from "lucide-react";

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
      <DialogContent className="modal relative">
        <button
          type="button"
          className="btn--close absolute top-3 right-3 z-10"
          aria-label="Sluiten"
          onClick={() => onOpenChange(false)}
        >
          <X size={20} />
        </button>
        
        <div className="modal__title">Gebruiker verwijderen</div>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-purple-dark">
              Weet je zeker dat je de gebruiker "{user?.username}" wilt verwijderen?
            </p>
            <p className="text-sm text-purple-dark mt-2">
              Deze actie kan niet ongedaan worden gemaakt.
            </p>
          </div>
          
          <div className="modal__actions">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn--danger"
            >
              {isDeleting ? "Verwijderen..." : "Verwijderen"}
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
