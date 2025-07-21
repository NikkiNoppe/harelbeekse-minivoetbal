
import React from "react";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage 
} from "../../../MINIVOETBAL.UI/components/ui/form";
import { Loader2 } from "lucide-react";
import { usePlayerSelection } from "./player-selection/usePlayerSelection";
import PlayerSelectionHeader from "./player-selection/PlayerSelectionHeader";
import PlayerSelectionTable from "./player-selection/PlayerSelectionTable";
import PlayerSelectionActions from "./player-selection/PlayerSelectionActions";
import { PlayerSelectionFormProps } from "./player-selection/types";

const PlayerSelectionForm: React.FC<PlayerSelectionFormProps> = ({ 
  matchId, 
  teamId, 
  teamName,
  isHomeTeam,
  onComplete
}) => {
  const {
    form,
    isLoading,
    submitting,
    onSubmit,
    togglePlayerSelection,
    toggleCaptain
  } = usePlayerSelection(matchId, teamId, onComplete);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Spelersinformatie laden...</span>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <PlayerSelectionHeader 
            teamName={teamName}
            selectedCount={form.watch('players').filter(p => p.selected).length}
          />
          
          <PlayerSelectionTable
            form={form}
            onTogglePlayerSelection={togglePlayerSelection}
            onToggleCaptain={toggleCaptain}
          />
          
          {form.formState.errors.players && (
            <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                {form.formState.errors.players.message}
              </p>
            </div>
          )}
          
          <PlayerSelectionActions 
            submitting={submitting}
            onComplete={onComplete}
          />
        </div>
      </form>
    </Form>
  );
};

export default PlayerSelectionForm;
