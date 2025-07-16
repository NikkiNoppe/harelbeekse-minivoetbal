import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    venues?: number[];
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
    venues: number[];
    notes: string;
  };
}

export const useTeamOperations = (onSuccess: () => void) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);



  const validateTeamData = (formData: TeamFormData): string | null => {
    if (!formData.name.trim()) {
      return "Teamnaam is verplicht";
    }
    
    if (formData.name.trim().length < 2) {
      return "Teamnaam moet minimaal 2 karakters bevatten";
    }
    
    if (formData.name.trim().length > 50) {
      return "Teamnaam mag maximaal 50 karakters bevatten";
    }
    
    // Validate email if provided
    if (formData.contact_email && !formData.contact_email.includes('@')) {
      return "Email adres moet een geldig formaat hebben";
    }
    
    return null;
  };

  const createTeam = async (formData: TeamFormData): Promise<Team | null> => {
    const validationError = validateTeamData(formData);
    if (validationError) {
      toast({
        title: "Validatie fout",
        description: validationError,
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teams')
        .insert({
          team_name: formData.name.trim(),
          contact_person: formData.contact_person.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          club_colors: formData.club_colors.trim() || null,
          preferred_play_moments: formData.preferred_play_moments
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Team toegevoegd",
        description: `${formData.name} is succesvol toegevoegd`,
      });
      
      onSuccess();
      return { ...data } as Team;
    } catch (error: any) {
      console.error('Error creating team:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Team bestaat al",
          description: "Er bestaat al een team met deze naam",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fout bij toevoegen",
          description: "Er is een fout opgetreden bij het toevoegen van het team",
          variant: "destructive",
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (teamId: number, formData: TeamFormData): Promise<Team | null> => {
    const validationError = validateTeamData(formData);
    if (validationError) {
      toast({
        title: "Validatie fout",
        description: validationError,
        variant: "destructive",
      });
      return null;
    }

    let updateSuccess = false;
    let updateData = null;
    let updateError = null;

    try {
      setLoading(true);
      
      // Approach 1: Standard update with new fields
      const { data: data1, error: error1 } = await supabase
        .from('teams')
        .update({
          team_name: formData.name.trim(),
          contact_person: formData.contact_person.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          club_colors: formData.club_colors.trim() || null,
          preferred_play_moments: formData.preferred_play_moments
        })
        .eq('team_id', teamId)
        .select()
        .single();
      
      if (!error1 && data1) {
        updateSuccess = true;
        updateData = data1;
      } else {
        updateError = error1;
      }
      
      // Approach 2: Update with explicit column selection including new fields
      if (!updateSuccess) {
        const { data: data2, error: error2 } = await supabase
          .from('teams')
          .update({
            team_name: formData.name.trim(),
            contact_person: formData.contact_person.trim() || null,
            contact_phone: formData.contact_phone.trim() || null,
            contact_email: formData.contact_email.trim() || null,
            club_colors: formData.club_colors.trim() || null,
            preferred_play_moments: formData.preferred_play_moments
          })
          .eq('team_id', teamId)
          .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
          .single();
        
        if (!error2 && data2) {
          updateSuccess = true;
          updateData = data2;
        } else {
          updateError = error2;
        }
      }
      
      if (updateSuccess) {
        toast({
          title: "Team bijgewerkt",
          description: `${formData.name} is succesvol bijgewerkt`,
        });
        onSuccess();
        return { ...updateData } as Team;
      } else {
        throw updateError;
      }
    } catch (error: any) {
      console.error('Error updating team:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van het team",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId: number): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check for related data before deleting
      const [playersResult, matchesResult, teamUsersResult] = await Promise.all([
        supabase.from('players').select('player_id').eq('team_id', teamId),
        supabase.from('matches').select('match_id').or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`),
        supabase.from('team_users').select('user_id').eq('team_id', teamId)
      ]);

      const hasPlayers = playersResult.data && playersResult.data.length > 0;
      const hasMatches = matchesResult.data && matchesResult.data.length > 0;
      const hasTeamUsers = teamUsersResult.data && teamUsersResult.data.length > 0;

      if (hasPlayers || hasMatches || hasTeamUsers) {
        const issues = [];
        if (hasPlayers) issues.push(`${playersResult.data!.length} speler(s)`);
        if (hasMatches) issues.push(`${matchesResult.data!.length} wedstrijd(en)`);
        if (hasTeamUsers) issues.push(`${teamUsersResult.data!.length} teamverantwoordelijke(n)`);
        
        toast({
          title: "Kan team niet verwijderen",
          description: `Dit team heeft nog ${issues.join(', ')} gekoppeld. Verwijder eerst deze relaties.`,
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      toast({
        title: "Team verwijderd",
        description: "Het team is succesvol verwijderd",
      });
      
      onSuccess();
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het team",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    validateTeamData
  };
}; 