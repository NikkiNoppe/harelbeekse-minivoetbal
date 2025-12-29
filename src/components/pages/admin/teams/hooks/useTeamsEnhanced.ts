import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTeamOperations } from "./useTeamOperations";

interface Team {
  team_id: number;
  team_name: string;
  player_manager_id?: number | null;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  club_colors?: string;
  preferred_play_moments?: {
    days?: string[];
    timeslots?: string[];
    venues?: string[]; // Changed from number[] to string[]
    notes?: string;
  };
}

interface TeamFormData {
  name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  club_colors: string;
  preferred_play_moments: {
    days: string[];
    timeslots: string[];
    venues: string[]; // Changed from number[] to string[]
    notes: string;
  };
  balance: string; // Add balance property to match the interface from useTeamOperations
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
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    club_colors: "",
    preferred_play_moments: {
      days: [],
      timeslots: [],
      venues: [],
      notes: ""
    },
    balance: "0"
  });
  
  // Use ref to track latest formData value for save operations
  const formDataRef = useRef(formData);
  
  // Keep ref in sync with formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const refreshData = () => {
    fetchTeams();
  };

  const { loading: operationsLoading, createTeam, updateTeam, deleteTeam } = useTeamOperations(refreshData);

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
      
      setTeams((data || []).map(team => ({ 
        ...team, 
        preferred_play_moments: team.preferred_play_moments as any
      })));
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
      contact_person: team.contact_person || "",
      contact_phone: team.contact_phone || "",
      contact_email: team.contact_email || "",
      club_colors: team.club_colors || "",
      preferred_play_moments: {
        days: team.preferred_play_moments?.days || [],
        timeslots: team.preferred_play_moments?.timeslots || [],
        venues: team.preferred_play_moments?.venues || [],
        notes: team.preferred_play_moments?.notes || ""
      },
      balance: "0" // Default balance value
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      contact_person: "",
      contact_phone: "",
      contact_email: "",
      club_colors: "",
      preferred_play_moments: {
        days: [],
        timeslots: [],
        venues: [],
        notes: ""
      },
      balance: "0"
    });
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof TeamFormData, value: any) => {
    if (field === 'preferred_play_moments') {
      // Use a more stable approach to prevent infinite loops
      setFormData(prevData => {
        const updated = {
          ...prevData,
          preferred_play_moments: {
            days: prevData.preferred_play_moments?.days || [],
            timeslots: prevData.preferred_play_moments?.timeslots || [],
            venues: prevData.preferred_play_moments?.venues || [],
            notes: prevData.preferred_play_moments?.notes || "",
            ...value
          }
        };
        formDataRef.current = updated; // Update ref immediately
        return updated;
      });
    } else {
      setFormData(prevData => {
        const updated = {...prevData, [field]: value};
        formDataRef.current = updated; // Update ref immediately
        return updated;
      });
    }
  };

  const handleSaveTeam = async () => {
    // Use ref to get the latest formData value, as state updates might be batched
    // Also wait a tiny bit to ensure any pending state updates are processed
    await new Promise(resolve => setTimeout(resolve, 10));
    const currentFormData = formDataRef.current;
    
    if (editingTeam) {
      const updatedTeam = await updateTeam(editingTeam.team_id, currentFormData);
      if (updatedTeam) {
        setDialogOpen(false);
        // Refresh teams list to show updated data
        fetchTeams();
      }
    } else {
      const newTeam = await createTeam(currentFormData);
      if (newTeam) {
        setDialogOpen(false);
        // Refresh teams list to show new team
        fetchTeams();
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
    fetchTeams: refreshData
  };
} 