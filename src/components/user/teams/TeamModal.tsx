import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { seasonService } from "@/services";

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
  const [seasonDataLoaded, setSeasonDataLoaded] = useState(false);

  // Local state for preferences - stable and direct
  const [localPreferences, setLocalPreferences] = useState({
    days: [] as string[],
    timeslots: [] as string[],
    venues: [] as number[],
    notes: ""
  });

  const isEditMode = !!editingTeam;
  const modalTitle = isEditMode ? "Team bewerken" : "Nieuw team toevoegen";
  const saveButtonText = loading ? "Opslaan..." : (isEditMode ? "Opslaan" : "Team toevoegen");

  // Load season data once when modal opens
  useEffect(() => {
    if (open && !seasonDataLoaded) {
      const loadSeasonData = async () => {
        try {
          const [days, timeslots, venues] = await Promise.all([
            seasonService.getAvailableDays(),
            seasonService.getAvailableTimeslots(),
            seasonService.getAvailableVenues()
          ]);
          
          setAvailableDays(Array.isArray(days) ? days : []);
          setAvailableTimeslots(Array.isArray(timeslots) ? timeslots : []);
          setAvailableVenues(Array.isArray(venues) ? venues : []);
          setSeasonDataLoaded(true);
        } catch (error) {
          console.error('Error loading season data:', error);
          setSeasonDataLoaded(true);
        }
      };
      loadSeasonData();
    }
  }, [open, seasonDataLoaded]);

  // Initialize local preferences when editing team
  useEffect(() => {
    if (editingTeam && open) {
      const preferences = editingTeam.preferred_play_moments || {};
      setLocalPreferences({
        days: preferences.days || [],
        timeslots: preferences.timeslots || [],
        venues: preferences.venues || [],
        notes: preferences.notes || ""
      });
    } else if (!editingTeam && open) {
      setLocalPreferences({
        days: [],
        timeslots: [],
        venues: [],
        notes: ""
      });
    }
  }, [editingTeam, open]);

  // Sync local preferences to parent form data
  useEffect(() => {
    onFormChange('preferred_play_moments', localPreferences);
  }, [localPreferences, onFormChange]);

  // Simple checkbox handler - no memoization needed
  const handleCheckboxChange = (type: 'days' | 'timeslots' | 'venues', value: string | number, checked: boolean) => {
    setLocalPreferences(prev => {
      const currentArray = prev[type] || [];
      let newArray: (string | number)[];
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return { ...prev, [type]: newArray };
    });
  };

  // Simple input change handler
  const handleInputChange = (field: string, value: string) => {
    onFormChange(field, value);
  };

  // Simple notes change handler
  const handleNotesChange = (value: string) => {
    setLocalPreferences(prev => ({ ...prev, notes: value }));
  };

  // Simple save handler
  const handleSave = () => {
    onSave();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSeasonDataLoaded(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        
        <form className="space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Team naam *</label>
            <Input
              placeholder="Voer team naam in"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contactpersoon</label>
              <Input
                placeholder="Naam contactpersoon"
                value={formData.contact_person || ''}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefoon</label>
              <Input
                placeholder="Telefoonnummer"
                value={formData.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              placeholder="Email adres"
              value={formData.contact_email || ''}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Clubkleuren</label>
            <Input
              placeholder="Bijv. Rood-Wit-Blauw"
              value={formData.club_colors || ''}
              onChange={(e) => handleInputChange('club_colors', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Preferred Play Moments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Speelmoment voorkeuren</h3>
            
            {/* Days */}
            {availableDays.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Voorkeur dagen</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={localPreferences.days.includes(day)}
                        onCheckedChange={(checked) => handleCheckboxChange('days', day, checked as boolean)}
                        disabled={loading}
                      />
                      <label htmlFor={`day-${day}`} className="text-sm">{day}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeslots */}
            {availableTimeslots.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Voorkeur tijdsloten</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableTimeslots.map((timeslot) => (
                    <div key={timeslot.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`timeslot-${timeslot.id}`}
                        checked={localPreferences.timeslots.includes(timeslot.id)}
                        onCheckedChange={(checked) => handleCheckboxChange('timeslots', timeslot.id, checked as boolean)}
                        disabled={loading}
                      />
                      <label htmlFor={`timeslot-${timeslot.id}`} className="text-sm">{timeslot.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venues */}
            {availableVenues.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Voorkeur locaties</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableVenues.map((venue) => (
                    <div key={venue.venue_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`venue-${venue.venue_id}`}
                        checked={localPreferences.venues.includes(venue.venue_id)}
                        onCheckedChange={(checked) => handleCheckboxChange('venues', venue.venue_id, checked as boolean)}
                        disabled={loading}
                      />
                      <label htmlFor={`venue-${venue.venue_id}`} className="text-sm">{venue.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Extra wensen</label>
              <Textarea
                placeholder="Extra opmerkingen of wensen"
                value={localPreferences.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !formData.name?.trim()}
            >
              {saveButtonText}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;