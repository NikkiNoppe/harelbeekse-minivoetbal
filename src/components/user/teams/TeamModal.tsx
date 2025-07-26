import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { seasonService } from "@/services";
import { X } from "lucide-react";

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

interface TeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeam?: {
    team_id: number;
    team_name: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    club_colors?: string;
    balance?: number;
    preferred_play_moments?: {
      days?: string[];
      timeslots?: string[];
      venues?: number[];
      notes?: string;
    };
  };
  onFormChange: (field: string, value: any) => void;
  onSave: () => void;
  formData: any;
  loading: boolean;
}

const TeamModal: React.FC<TeamModalProps> = ({
  open,
  onOpenChange,
  editingTeam,
  formData,
  onFormChange,
  onSave,
  loading
}) => {
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeslots, setAvailableTimeslots] = useState<Array<{id: string; label: string}>>([]);
  const [availableVenues, setAvailableVenues] = useState<Array<{venue_id: number; name: string; address: string}>>([]);
  const [teamName, setTeamName] = useState(editingTeam?.team_name || '');
  const [description, setDescription] = useState('');
  const [isEdit, setIsEdit] = useState(!!editingTeam);
  const [isLoading, setIsLoading] = useState(loading);

  // Load season data for dropdowns
  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        const [days, timeslots, venues] = await Promise.all([
          seasonService.getAvailableDays(),
          seasonService.getAvailableTimeslots(),
          seasonService.getAvailableVenues()
        ]);
        
        // Ensure we have valid arrays
        setAvailableDays(Array.isArray(days) ? days : []);
        setAvailableTimeslots(Array.isArray(timeslots) ? timeslots : []);
        setAvailableVenues(Array.isArray(venues) ? venues : []);
      } catch (error) {
        console.error('Error loading season data:', error);
        // Set empty arrays as fallback
        setAvailableDays([]);
        setAvailableTimeslots([]);
        setAvailableVenues([]);
      }
    };

    if (open) {
      loadSeasonData();
    }
  }, [open]);

  // Ensure formData is always complete when editing
  useEffect(() => {
    if (editingTeam && open) {
      setTeamName(editingTeam.team_name || '');
      setDescription(editingTeam.contact_person || ''); // Assuming description is contact_person for now
      onFormChange('name', editingTeam.team_name || '');
      onFormChange('contact_person', editingTeam.contact_person || '');
      onFormChange('contact_phone', editingTeam.contact_phone || '');
      onFormChange('contact_email', editingTeam.contact_email || '');
      onFormChange('club_colors', editingTeam.club_colors || '');
      onFormChange('preferred_play_moments', {
        days: editingTeam.preferred_play_moments?.days || [],
        timeslots: editingTeam.preferred_play_moments?.timeslots || [],
        venues: editingTeam.preferred_play_moments?.venues || [],
        notes: editingTeam.preferred_play_moments?.notes || ''
      });
    }
  }, [editingTeam, open]);

  const handlePreferenceChange = (type: 'days' | 'timeslots' | 'venues', value: string | number, checked: boolean) => {
    const currentPreferences = formData.preferred_play_moments;
    let updatedArray: (string | number)[] = [...(currentPreferences[type] || [])];
    
    if (checked) {
      updatedArray.push(value);
    } else {
      updatedArray = updatedArray.filter(item => item !== value);
    }
    
    onFormChange('preferred_play_moments', {
      ...currentPreferences,
      [type]: updatedArray
    });
  };

  const handleSave = () => {
    setIsLoading(true);
    // In a real application, you would validate and send the data to an API
    // For now, we'll just simulate saving
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      // Optionally, update the editingTeam prop if you want to reflect changes in the parent
      // onFormChange('name', teamName); 
    }, 1000);
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
        
        <div className="modal__title">
          {isEdit ? "Team bewerken" : "Nieuw team toevoegen"}
        </div>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-purple-dark">Team naam</label>
            <Input
              placeholder="Voer team naam in"
              className="modal__input bg-white placeholder:text-purple-200"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-purple-dark">Beschrijving (optioneel)</label>
            <textarea
              placeholder="Voer beschrijving in"
              className="modal__input bg-white placeholder:text-purple-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
          
          <div className="modal__actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !teamName.trim()}
              className="btn btn--primary"
            >
              {isLoading ? "Opslaan..." : (isEdit ? "Opslaan" : "Team toevoegen")}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn--secondary"
              disabled={isLoading}
            >
              Annuleren
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;
