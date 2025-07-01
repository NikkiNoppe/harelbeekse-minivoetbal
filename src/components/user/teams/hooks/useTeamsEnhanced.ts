import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTeamOperations } from "./useTeamOperations";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
  player_manager_id?: number | null;
}

interface TeamFormData {
  name: string;
  balance: string;
}

export function useTeamsEnhanced() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    balance: "0"
  });

  const refreshData = () => {
    fetchTeams();
  };

  const { loading: operationsLoading, createTeam, updateTeam, deleteTeam, testUpdate, testUpdateWithRLSBypass } = useTeamOperations(refreshData);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');
      
      if (error) {
        throw error;
      }
      
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
  }, [toast]);

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.team_name,
      balance: team.balance.toString()
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      balance: "0"
    });
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof TeamFormData, value: string) => {
    setFormData({...formData, [field]: value});
  };

  const handleSaveTeam = async () => {
    if (editingTeam) {
      const updatedTeam = await updateTeam(editingTeam.team_id, formData);
      if (updatedTeam) {
        setDialogOpen(false);
      }
    } else {
      const newTeam = await createTeam(formData);
      if (newTeam) {
        setDialogOpen(false);
      }
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    const success = await deleteTeam(teamId);
    if (success) {
      setConfirmDeleteOpen(false);
      setTeamToDelete(null);
    }
  };

  const confirmDelete = (team: Team) => {
    setTeamToDelete(team);
    setConfirmDeleteOpen(true);
  };

  return {
    teams,
    loading,
    saving: operationsLoading,
    deleting: operationsLoading,
    dialogOpen,
    setDialogOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    teamToDelete,
    editingTeam,
    formData,
    handleAddNew,
    handleEditTeam,
    handleFormChange,
    handleSaveTeam,
    handleDeleteTeam,
    confirmDelete,
    fetchTeams: refreshData,
    testUpdate,
    testUpdateWithRLSBypass
  };
} 