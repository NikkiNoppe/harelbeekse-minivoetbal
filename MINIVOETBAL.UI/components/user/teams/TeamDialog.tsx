import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { seasonService } from '../../../MINIVOETBAL.SERVICES/seasonService';

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

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeam: { 
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
  } | null;
  formData: TeamFormData;
  onFormChange: (field: keyof TeamFormData, value: any) => void;
  onSave: () => void;
  loading: boolean;
}

const TeamDialog: React.FC<TeamDialogProps> = ({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-purple-100 border-purple-light shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-center text-purple-light">
            {editingTeam ? "Team bewerken" : "Nieuw team toevoegen"}
          </DialogTitle>
          <DialogDescription className="text-center text-purple-dark">
            {editingTeam 
              ? "Bewerk de gegevens van dit team" 
              : "Voeg een nieuw team toe aan de competitie"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4 bg-purple-100">
          {/* Basic Team Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-dark">Basis Informatie</h3>
            
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Teamnaam *</Label>
              <Input
                value={formData.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                placeholder="Naam van het team"
                className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
              />
            </div>
            
            {/* Removed Balance field */}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-dark">Contact Informatie</h3>
            
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Contactpersoon</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => onFormChange("contact_person", e.target.value)}
                placeholder="Naam van de contactpersoon"
                className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Telefoon</Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => onFormChange("contact_phone", e.target.value)}
                placeholder="Telefoonnummer"
                className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Email</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => onFormChange("contact_email", e.target.value)}
                placeholder="Emailadres"
                className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Clubkleuren</Label>
              <Input
                value={formData.club_colors}
                onChange={(e) => onFormChange("club_colors", e.target.value)}
                placeholder="bv. rood-wit"
                className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>

          {/* Play Moment Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-dark">Speelmoment Voorkeuren</h3>
            
            {/* Preferred Days */}
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Voorkeursdag(en)</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableDays.length > 0 ? (
                  availableDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={formData.preferred_play_moments.days.includes(day)}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange('days', day, checked as boolean)
                        }
                      />
                      <Label htmlFor={`day-${day}`} className="text-sm text-purple-dark">
                        {typeof day === 'string' ? day.charAt(0).toUpperCase() + day.slice(1) : String(day)}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Geen dagen beschikbaar</div>
                )}
              </div>
            </div>
            
            {/* Preferred Timeslots */}
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Voorkeur tijdslot(en)</Label>
              <div className="grid grid-cols-1 gap-2">
                {availableTimeslots.length > 0 ? (
                  availableTimeslots.map((timeslot) => (
                    <div key={timeslot.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`timeslot-${timeslot.id}`}
                        checked={formData.preferred_play_moments.timeslots.includes(timeslot.id)}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange('timeslots', timeslot.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`timeslot-${timeslot.id}`} className="text-sm text-purple-dark">
                        {timeslot.label}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Geen tijdsloten beschikbaar</div>
                )}
              </div>
            </div>
            
            {/* Preferred Venues */}
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Voorkeur locatie(s)</Label>
              <div className="grid grid-cols-1 gap-2">
                {availableVenues.length > 0 ? (
                  availableVenues.map((venue) => (
                    <div key={venue.venue_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`venue-${venue.venue_id}`}
                        checked={formData.preferred_play_moments.venues.includes(venue.venue_id)}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange('venues', venue.venue_id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`venue-${venue.venue_id}`} className="text-sm text-purple-dark">
                        {venue.name || 'Onbekende locatie'}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Geen locaties beschikbaar</div>
                )}
              </div>
            </div>
            
            {/* Extra Notes */}
            <div className="space-y-2">
              <Label className="text-purple-dark font-medium">Extra wensen</Label>
              <Textarea
                value={formData.preferred_play_moments.notes}
                onChange={(e) => onFormChange('preferred_play_moments', {
                  ...formData.preferred_play_moments,
                  notes: e.target.value
                })}
                placeholder="Extra wensen of opmerkingen over speelmomenten..."
                className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-purple-100">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="btn-light"
          >
            Annuleren
          </Button>
          <Button 
            onClick={onSave} 
            disabled={loading}
            className="btn-dark"
          >
            {loading ? "Opslaan..." : (editingTeam ? "Bijwerken" : "Toevoegen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDialog;
