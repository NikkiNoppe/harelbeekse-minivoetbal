
import { useState, useEffect } from "react";
import { useToast } from "@shared/hooks/use-toast";
import { supabase } from "@shared/integrations/supabase/client";

interface Team {
  team_id: number;
  team_name: string;
}

export const useTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de teams.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    setTeams,
    loading,
    dialogOpen: false,
    setDialogOpen: () => {},
    newTeamName: "",
    setNewTeamName: () => {},
    editingTeam: null,
    setEditingTeam: () => {},
    editedTeamName: "",
    setEditedTeamName: () => {},
    fetchTeams
  };
};
