import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { teamService } from "@/services/core/teamService";
import { fetchTeamForSession } from "@/services/core/teamsSessionFetch";
import { fetchPlayersForSession } from "@/services/core/playersSessionFetch";
import { fetchAllMatchesForSession } from "@/services/core/matchesSessionFetch";
import { joinContactEmails, parseContactEmails, validateContactEmails } from "@/lib/contactEmails";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
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
  balance: string;
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
    
    // Validate email(s) if provided
    const emailError = validateContactEmails(formData.contact_email);
    if (emailError) {
      return emailError;
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

      const data = await teamService.createTeam({
        team_name: formData.name.trim(),
        contact_person: formData.contact_person.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        contact_email: joinContactEmails(parseContactEmails(formData.contact_email)) || undefined,
        club_colors: formData.club_colors?.trim() || undefined,
        preferred_play_moments: formData.preferred_play_moments as any,
      });

      if (!data) throw new Error('Kon team niet aanmaken');

      toast({
        title: "Team toegevoegd",
        description: `${formData.name} is succesvol toegevoegd`,
      });

      onSuccess();
      return { ...data, balance: 0 } as unknown as Team;
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

    try {
      setLoading(true);

      const existingTeam = await fetchTeamForSession(teamId);
      if (!existingTeam) {
        toast({
          title: "Team niet gevonden",
          description: "Het team dat je wilt bijwerken bestaat niet meer",
          variant: "destructive",
        });
        return null;
      }

      const allTeams = await teamService.getAllTeams();
      if (allTeams.some((t) => t.team_id !== teamId && t.team_name === formData.name.trim())) {
        toast({
          title: "Team bestaat al",
          description: "Er bestaat al een team met deze naam",
          variant: "destructive",
        });
        return null;
      }

      const updateData = await teamService.updateTeam(teamId, {
        team_name: formData.name.trim(),
        contact_person: formData.contact_person?.trim() || undefined,
        contact_phone: formData.contact_phone?.trim() || undefined,
        contact_email: joinContactEmails(parseContactEmails(formData.contact_email)) || undefined,
        club_colors: formData.club_colors?.trim() || undefined,
        preferred_play_moments: formData.preferred_play_moments as any,
      });

      if (!updateData) throw new Error('Kon team niet bijwerken');

      toast({
        title: "Team bijgewerkt",
        description: `${formData.name} is succesvol bijgewerkt`,
      });

      onSuccess();
      return { ...updateData, balance: 0 } as unknown as Team;
    } catch (error: any) {
      console.error('Error updating team:', error);
      
      let errorMessage = "Er is een fout opgetreden bij het bijwerken van het team";
      
      if (error.code === '23505') {
        errorMessage = "Er bestaat al een team met deze naam";
      } else if (error.code === '23503') {
        errorMessage = "Kan team niet bijwerken vanwege gekoppelde gegevens";
      } else if (error.code === '23514') {
        errorMessage = "Teamnaam voldoet niet aan de vereisten";
      } else if (error.code === '42501') {
        errorMessage = "Geen rechten om dit team bij te werken (RLS policy)";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Fout bij bijwerken",
        description: errorMessage,
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
      
      const [players, allMatches] = await Promise.all([
        fetchPlayersForSession(teamId),
        fetchAllMatchesForSession().catch(() => []),
      ]);

      const hasPlayers = players.length > 0;
      const hasMatches = allMatches.some(
        (m) => m.home_team_id === teamId || m.away_team_id === teamId,
      );
      const hasTeamUsers = false;

      if (hasPlayers || hasMatches || hasTeamUsers) {
        const issues = [];
        if (hasPlayers) issues.push(`${players.length} speler(s)`);
        if (hasMatches) issues.push('wedstrijd(en)');
        if (hasTeamUsers) issues.push('teamverantwoordelijke(n)');
        
        toast({
          title: "Kan team niet verwijderen",
          description: `Dit team heeft nog ${issues.join(', ')} gekoppeld. Verwijder eerst deze relaties.`,
          variant: "destructive",
        });
        return false;
      }

      await teamService.deleteTeam(teamId);
      
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