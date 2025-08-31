import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
interface PlayerSelectionActionsProps {
  onSavePlayerSelection: () => void;
  isSubmittingPlayers: boolean;
  canEdit: boolean;
  isTeamManager: boolean;
}
const PlayerSelectionActions: React.FC<PlayerSelectionActionsProps> = ({
  onSavePlayerSelection,
  isSubmittingPlayers,
  canEdit,
  isTeamManager
}) => {
  if (!isTeamManager || !canEdit) return null;
  return <div className="flex justify-center mt-4">
      
    </div>;
};
export default React.memo(PlayerSelectionActions);