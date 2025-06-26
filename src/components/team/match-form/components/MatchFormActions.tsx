
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Lock } from "lucide-react";

interface MatchFormActionsProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  canEdit: boolean;
  isReferee: boolean;
  isTeamManager: boolean;
  isAdmin: boolean;
  isLocked?: boolean;
}

export const MatchFormActions: React.FC<MatchFormActionsProps> = ({
  onSubmit,
  isSubmitting,
  canEdit,
  isReferee,
  isTeamManager,
  isAdmin,
  isLocked = false
}) => {
  // Admin can always edit, even if locked
  const canActuallyEdit = canEdit || isAdmin;
  
  // Determine button text based on role and admin status
  const getButtonText = () => {
    if (isAdmin) {
      return isLocked ? "Admin: Opslaan & Bijwerken" : "Admin: Opslaan & Indienen";
    }
    if (isReferee) {
      return "Bevestigen & Vergrendelen";
    }
    if (isTeamManager) {
      return "Spelers opslaan";
    }
    return "Opslaan";
  };

  const getButtonIcon = () => {
    if (isAdmin || isReferee) {
      return isLocked ? <Save className="h-4 w-4" /> : <Lock className="h-4 w-4" />;
    }
    return <Save className="h-4 w-4" />;
  };

  return (
    <div className="flex justify-center">
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || (!canActuallyEdit && !isAdmin)}
        className="flex items-center gap-2 px-8"
        style={{
          background: "var(--main-color-dark)",
          color: "#fff",
          borderColor: "var(--main-color-dark)"
        }}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
    </div>
  );
};
