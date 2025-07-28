import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [isLoading, setIsLoading] = useState(loading);
  const [isEdit, setIsEdit] = useState(!!editingTeam);
  const [seasonDataLoaded, setSeasonDataLoaded] = useState(false);
  const [testCheckboxChecked, setTestCheckboxChecked] = useState(false);

  // Memoized values to prevent unnecessary re-renders
  const isEditMode = useMemo(() => !!editingTeam, [editingTeam]);
  const modalTitle = useMemo(() => isEditMode ? "Team bewerken" : "Nieuw team toevoegen", [isEditMode]);
  const saveButtonText = useMemo(() => {
    if (isLoading) return "Opslaan...";
    return isEditMode ? "Opslaan" : "Team toevoegen";
  }, [isLoading, isEditMode]);

  // Sync isLoading with loading prop
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  // Load season data for dropdowns - optimized to load only once
  useEffect(() => {
    const loadSeasonData = async () => {
      if (seasonDataLoaded) return;
      
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
        setAvailableDays([]);
        setAvailableTimeslots([]);
        setAvailableVenues([]);
        setSeasonDataLoaded(true);
      }
    };

    if (open && !seasonDataLoaded) {
      loadSeasonData();
    }
  }, [open, seasonDataLoaded]);

  // Reset season data loaded when modal closes
  useEffect(() => {
    if (!open) {
      setSeasonDataLoaded(false);
    }
  }, [open]);

  // Optimized form data population for editing
  useEffect(() => {
    if (editingTeam && open) {
      const teamData = {
        name: editingTeam.team_name || '',
        contact_person: editingTeam.contact_person || '',
        contact_phone: editingTeam.contact_phone || '',
        contact_email: editingTeam.contact_email || '',
        club_colors: editingTeam.club_colors || '',
        preferred_play_moments: {
          days: editingTeam.preferred_play_moments?.days || [],
          timeslots: editingTeam.preferred_play_moments?.timeslots || [],
          venues: editingTeam.preferred_play_moments?.venues || [],
          notes: editingTeam.preferred_play_moments?.notes || ''
        }
      };

      // Batch all form changes to reduce re-renders
      Object.entries(teamData).forEach(([key, value]) => {
        onFormChange(key, value);
      });
    }
  }, [editingTeam, open, onFormChange]);

  // Simple preference selection checker without memoization
  const isPreferenceSelected = (type: 'days' | 'timeslots' | 'venues', value: string | number): boolean => {
    const currentPreferences = formData.preferred_play_moments || {};
    const array = currentPreferences[type] || [];
    return array.includes(value);
  };

  // Simple preference change handler without memoization
  const handlePreferenceChange = (type: 'days' | 'timeslots' | 'venues', value: string | number, checked: boolean) => {
    const currentPreferences = formData.preferred_play_moments || {};
    let updatedArray: (string | number)[] = [...(currentPreferences[type] || [])];
    
    if (checked) {
      updatedArray.push(value);
    } else {
      updatedArray = updatedArray.filter(item => item !== value);
    }
    
    const updatedPreferences = {
      ...currentPreferences,
      [type]: updatedArray
    };
    
    onFormChange('preferred_play_moments', updatedPreferences);
  };

  // Memoized save handler
  const handleSave = useCallback(() => {
    setIsLoading(true);
    onSave();
  }, [onSave]);

  // Memoized form field change handlers
  const handleInputChange = useCallback((field: string, value: string) => {
    onFormChange(field, value);
  }, [onFormChange]);

  const handleNotesChange = useCallback((value: string) => {
    onFormChange('preferred_play_moments', {
      ...formData.preferred_play_moments,
      notes: value
    });
  }, [formData.preferred_play_moments, onFormChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal relative max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="modal__title">
            {modalTitle}
          </DialogTitle>
        </DialogHeader>
        
        <form className="space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Team naam *</label>
            <Input
              placeholder="Voer team naam in"
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-purple-dark font-medium">Contactpersoon</label>
              <Input
                placeholder="Naam contactpersoon"
                className="modal__input bg-white placeholder:text-purple-200"
                value={formData.contact_person || ''}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-purple-dark font-medium">Telefoon</label>
              <Input
                placeholder="Telefoonnummer"
                className="modal__input bg-white placeholder:text-purple-200"
                value={formData.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Email</label>
            <Input
              placeholder="Email adres"
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.contact_email || ''}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Clubkleuren</label>
            <Input
              placeholder="Bijv. Rood-Wit-Blauw"
              className="modal__input bg-white placeholder:text-purple-200"
              value={formData.club_colors || ''}
              onChange={(e) => handleInputChange('club_colors', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Preferred Play Moments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-dark">Speelmoment voorkeuren</h3>
            
            {/* Days */}
            {availableDays.length > 0 && (
              <div className="space-y-2">
                <label className="text-purple-dark font-medium">Voorkeur dagen</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={isPreferenceSelected('days', day)}
                        onCheckedChange={(checked) => handlePreferenceChange('days', day, checked as boolean)}
                        disabled={isLoading}
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
                <label className="text-purple-dark font-medium">Voorkeur tijdsloten</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableTimeslots.map((timeslot) => (
                    <div key={timeslot.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`timeslot-${timeslot.id}`}
                        checked={isPreferenceSelected('timeslots', timeslot.id)}
                        onCheckedChange={(checked) => handlePreferenceChange('timeslots', timeslot.id, checked as boolean)}
                        disabled={isLoading}
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
                <label className="text-purple-dark font-medium">Voorkeur locaties</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableVenues.map((venue) => (
                    <div key={venue.venue_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`venue-${venue.venue_id}`}
                        checked={isPreferenceSelected('venues', venue.venue_id)}
                        onCheckedChange={(checked) => handlePreferenceChange('venues', venue.venue_id, checked as boolean)}
                        disabled={isLoading}
                      />
                      <label htmlFor={`venue-${venue.venue_id}`} className="text-sm">{venue.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-purple-dark font-medium">Extra wensen</label>
              <Textarea
                placeholder="Extra opmerkingen of wensen"
                className="modal__input bg-white placeholder:text-purple-200"
                value={formData.preferred_play_moments?.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="modal__actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !formData.name?.trim()}
              className="btn btn--primary"
            >
              {saveButtonText}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn--secondary"
              disabled={isLoading}
            >
              Annuleren
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamModal;
