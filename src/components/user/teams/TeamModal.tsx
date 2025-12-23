import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/ui/app-modal";
import { Input } from "@/components/ui/input";
// Removed Textarea import as extra notes are no longer used
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
      venues?: string[];
      notes?: string;
    };
  };
  onFormChange: (field: string, value: any) => void;
  onSave: () => void;
  formData: any;
  loading: boolean;
}

interface LocalPreferences {
  days: string[];
  timeslots: string[];
  venues: string[];
  notes: string;
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
  // State management
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeslots, setAvailableTimeslots] = useState<Array<{id: string; label: string}>>([]);
  const [availableVenues, setAvailableVenues] = useState<Array<{venue_id: number; name: string; address: string}>>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [seasonDataLoaded, setSeasonDataLoaded] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<LocalPreferences>({
    days: [],
    timeslots: [],
    venues: [],
    notes: ""
  });

  // Memoized computed values
  const isEditMode = useMemo(() => !!editingTeam, [editingTeam]);
  const modalTitle = useMemo(() => 
    isEditMode ? "Team bewerken" : "Nieuw team toevoegen", 
    [isEditMode]
  );
  const saveButtonText = useMemo(() => {
    if (isLoading) return "Opslaan...";
    return isEditMode ? "Opslaan" : "Team toevoegen";
  }, [isLoading, isEditMode]);
  const isFormValid = useMemo(() => 
    !!(formData.name?.trim()), 
    [formData.name]
  );

  // Memoized lookup maps for better performance
  const venueMap = useMemo(() => 
    new Map(availableVenues.map(v => [v.venue_id, v.name])), 
    [availableVenues]
  );
  const timeslotMap = useMemo(() => 
    new Map(availableTimeslots.map(t => [t.id, t.label])), 
    [availableTimeslots]
  );

  // Sync loading state
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  // Load season data once when modal opens
  useEffect(() => {
    const loadSeasonData = async () => {
      if (seasonDataLoaded || !open) return;
      
      try {
        const [days, timeslots, venues] = await Promise.all([
          seasonService.getAvailableDays(),
          seasonService.getAvailableTimeslots(),
          seasonService.getAvailableVenues()
        ]);
        
        setAvailableDays(Array.isArray(days) ? days : []);
        // Deduplicate timeslots by label and sort ascending by start time
        if (Array.isArray(timeslots)) {
          const seen = new Set<string>();
          const uniqueTimeslots: Array<{ id: string; label: string }> = [];
          const parseStartMinutes = (label: string): number => {
            const timeMatch = label.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              return hours * 60 + minutes;
            }
            const hourOnly = label.match(/(\d{1,2})/);
            if (hourOnly) {
              return parseInt(hourOnly[1], 10) * 60;
            }
            return Number.MAX_SAFE_INTEGER;
          };
          for (const t of timeslots) {
            const label = (t as any).label ?? String(t);
            const id = (t as any).id ?? label;
            if (!seen.has(label)) {
              seen.add(label);
              uniqueTimeslots.push({ id: String(id), label: String(label) });
            }
          }
          uniqueTimeslots.sort((a, b) => parseStartMinutes(a.label) - parseStartMinutes(b.label));
          setAvailableTimeslots(uniqueTimeslots);
        } else {
          setAvailableTimeslots([]);
        }
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

    loadSeasonData();
  }, [open, seasonDataLoaded]);

  // Initialize preferences when editing team
  useEffect(() => {
    if (!open) return;

    if (editingTeam) {
      const preferences = editingTeam.preferred_play_moments || {};
      setLocalPreferences({
        days: preferences.days || [],
        timeslots: preferences.timeslots || [],
        venues: preferences.venues || [],
        notes: preferences.notes || ""
      });
    } else {
      setLocalPreferences({
        days: [],
        timeslots: [],
        venues: [],
        notes: ""
      });
    }
  }, [editingTeam, open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSeasonDataLoaded(false);
    }
  }, [open]);

  // Optimized preference selection check
  const isPreferenceSelected = useCallback((type: 'days' | 'timeslots' | 'venues', value: string | number): boolean => {
    switch (type) {
      case 'venues':
        const venueName = venueMap.get(value as number) || String(value);
        return localPreferences.venues.includes(venueName);
      case 'timeslots':
        const timeslotLabel = timeslotMap.get(value as string) || String(value);
        return localPreferences.timeslots.includes(timeslotLabel);
      case 'days':
        return localPreferences.days.includes(value as string);
      default:
        return false;
    }
  }, [localPreferences, venueMap, timeslotMap]);

  // Optimized preference change handler
  const handlePreferenceChange = useCallback((type: 'days' | 'timeslots' | 'venues', value: string | number, checked: boolean) => {
    setLocalPreferences(prev => {
      let newPreferences: LocalPreferences;
      
      switch (type) {
        case 'venues': {
          const venueName = venueMap.get(value as number) || String(value);
          const newArray = checked 
            ? [...prev.venues, venueName]
            : prev.venues.filter(item => item !== venueName);
          newPreferences = { ...prev, venues: newArray };
          break;
        }
        case 'timeslots': {
          const timeslotLabel = timeslotMap.get(value as string) || String(value);
          const newArray = checked 
            ? [...prev.timeslots, timeslotLabel]
            : prev.timeslots.filter(item => item !== timeslotLabel);
          newPreferences = { ...prev, timeslots: newArray };
          break;
        }
        case 'days': {
          const newArray = checked 
            ? [...prev.days, value as string]
            : prev.days.filter(item => item !== value);
          newPreferences = { ...prev, days: newArray };
          break;
        }
        default:
          return prev;
      }
      
      // Sync to parent immediately
      onFormChange('preferred_play_moments', newPreferences);
      return newPreferences;
    });
  }, [venueMap, timeslotMap, onFormChange]);

  // Optimized input change handler
  const handleInputChange = useCallback((field: string, value: string) => {
    onFormChange(field, value);
  }, [onFormChange]);

  // Notes field removed (not used)

  // Optimized save handler
  const handleSave = useCallback(() => {
    onFormChange('preferred_play_moments', localPreferences);
    onSave();
  }, [localPreferences, onFormChange, onSave]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Memoized form sections to prevent unnecessary re-renders
  const teamNameSection = useMemo(() => (
    <div className="space-y-2">
      <label className="text-purple-dark font-medium">Team naam *</label>
      <Input
        placeholder="Voer team naam in"
        className="modal__input"
        value={formData.name || ''}
        onChange={(e) => handleInputChange('name', e.target.value)}
        disabled={isLoading}
      />
    </div>
  ), [formData.name, handleInputChange, isLoading]);

  const contactSection = useMemo(() => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-purple-dark font-medium">Contactpersoon</label>
          <Input
            placeholder="Naam contactpersoon"
            className="modal__input"
            value={formData.contact_person || ''}
            onChange={(e) => handleInputChange('contact_person', e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-purple-dark font-medium">Telefoon</label>
          <Input
            placeholder="Telefoonnummer"
            className="modal__input"
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
          className="modal__input"
          value={formData.contact_email || ''}
          onChange={(e) => handleInputChange('contact_email', e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-purple-dark font-medium">Clubkleuren</label>
        <Input
          placeholder="Bijv. Rood-Wit-Blauw"
          className="modal__input"
          value={formData.club_colors || ''}
          onChange={(e) => handleInputChange('club_colors', e.target.value)}
          disabled={isLoading}
        />
      </div>
    </>
  ), [formData, handleInputChange, isLoading]);

  const preferencesSection = useMemo(() => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-purple-dark">Speelmoment voorkeuren</h3>
      
      {/* Days */}
      {availableDays.length > 0 && (
        <div className="space-y-2">
          <label className="text-purple-dark font-medium">Voorkeur dagen</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableDays.map((day) => {
              const selected = isPreferenceSelected('days', day);
              return (
                <label key={day} htmlFor={`day-${day}`} className="select-chip">
                  <Checkbox
                    id={`day-${day}`}
                    className="select-box"
                    checked={selected}
                    onCheckedChange={(checked) => handlePreferenceChange('days', day, checked as boolean)}
                    disabled={isLoading}
                  />
                  <span className="select-chip__label">{day}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeslots */}
      {availableTimeslots.length > 0 && (
        <div className="space-y-2">
          <label className="text-purple-dark font-medium">Voorkeur tijdsloten</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableTimeslots.map((timeslot) => {
              const selected = isPreferenceSelected('timeslots', timeslot.id);
              return (
                <label key={timeslot.id} htmlFor={`timeslot-${timeslot.id}`} className="select-chip">
                  <Checkbox
                    id={`timeslot-${timeslot.id}`}
                    className="select-box"
                    checked={selected}
                    onCheckedChange={(checked) => handlePreferenceChange('timeslots', timeslot.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <span className="select-chip__label">{timeslot.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Venues */}
      {availableVenues.length > 0 && (
        <div className="space-y-2">
          <label className="text-purple-dark font-medium">Voorkeur locaties</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableVenues.map((venue) => {
              const selected = isPreferenceSelected('venues', venue.venue_id);
              return (
                <label key={venue.venue_id} htmlFor={`venue-${venue.venue_id}`} className="select-chip">
                  <Checkbox
                    id={`venue-${venue.venue_id}`}
                    className="select-box"
                    checked={selected}
                    onCheckedChange={(checked) => handlePreferenceChange('venues', venue.venue_id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <span className="select-chip__label">{venue.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes removed */}
    </div>
  ), [availableDays, availableTimeslots, availableVenues, isPreferenceSelected, handlePreferenceChange, isLoading]);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      subtitle="Vul de details van het team in. Alle velden zijn verplicht."
      size="lg"
      primaryAction={{
        label: saveButtonText,
        onClick: handleSave,
        variant: "primary",
        disabled: isLoading || !isFormValid,
        loading: isLoading,
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: handleClose,
        variant: "secondary",
        disabled: isLoading,
      }}
    >
      <form className="space-y-4">
        {teamNameSection}
        {contactSection}
        {preferencesSection}
      </form>
    </AppModal>
  );
};

export default TeamModal;