
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AppModal,
  AppModalBody,
} from "@/components/ui/app-modal";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface TeamOption {
  id: number;
  name: string;
}

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: {
    id: number;
    username: string;
    email?: string;
    password: string;
    role: "admin" | "referee" | "player_manager";
    teamId?: number;
    teams?: {team_id: number, team_name: string}[];
  };
  onSave: (formData: any) => Promise<boolean>;
  teams: TeamOption[];
  isLoading?: boolean;
  passwordEmailNote?: string;
  onPasswordEmailNoteChange?: (value: string) => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "referee" | "player_manager";
  selectedTeamId: number | null;
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onOpenChange,
  editingUser,
  onSave,
  teams,
  isLoading = false,
  passwordEmailNote,
  onPasswordEmailNoteChange
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    role: "player_manager",
    selectedTeamId: null
  });

  // Memoized initial form data to prevent unnecessary recalculations
  const initialFormData = useMemo((): FormData | null => {
    if (!open) return null;
    
    if (editingUser) {
      const currentTeamId = editingUser.teams && editingUser.teams.length > 0 
        ? editingUser.teams[0].team_id 
        : editingUser.teamId || null;

      return {
        username: editingUser.username,
        email: editingUser.email || "",
        password: "",
        role: editingUser.role,
        selectedTeamId: currentTeamId
      };
    } else {
      return {
        username: "",
        email: "",
        password: "",
        role: "player_manager",
        selectedTeamId: teams.length > 0 ? teams[0].id : null
      };
    }
  }, [open, editingUser, teams]);

  // Optimized useEffect with memoized dependency
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
  }, [initialFormData]);

  // Memoized input change handler
  const handleInputChange = useCallback((field: keyof FormData, value: string | number | null) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-clear team when role changes to admin/referee
      if (field === 'role' && (value === 'admin' || value === 'referee')) {
        newData.selectedTeamId = null;
      }
      
      return newData;
    });
  }, []);

  // Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      console.error('Username is required');
      return;
    }

    // Validate admin/referee roles don't have team assignments
    if ((formData.role === 'admin' || formData.role === 'referee') && formData.selectedTeamId) {
      alert('Administrators en scheidsrechters kunnen geen team hebben toegewezen.');
      return;
    }

    try {
      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
        role: formData.role,
        teamId: (formData.role === 'player_manager' && formData.selectedTeamId) ? formData.selectedTeamId : null,
        teamIds: (formData.role === 'player_manager' && formData.selectedTeamId) ? [formData.selectedTeamId] : []
      };

      const success = await onSave(submitData);
      
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }, [formData, onSave, onOpenChange]);

  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Memoized computed values
  const isTeamSelectionDisabled = useMemo(() => 
    formData.role === "admin" || formData.role === "referee", 
    [formData.role]
  );

  const modalTitle = useMemo(() => 
    editingUser ? "Gebruiker bewerken" : "Nieuwe gebruiker toevoegen",
    [editingUser]
  );

  const modalDescription = useMemo(() => 
    editingUser ? "Bewerk de gegevens van de gebruiker" : "Voeg een nieuwe gebruiker toe",
    [editingUser]
  );

  const submitButtonText = useMemo(() => 
    isLoading ? "Bezig..." : (editingUser ? "Bijwerken" : "Toevoegen"),
    [isLoading, editingUser]
  );

  const passwordLabel = useMemo(() => 
    editingUser ? "Nieuw wachtwoord (leeg laten om niet te wijzigen)" : "Wachtwoord *",
    [editingUser]
  );

  const passwordPlaceholder = useMemo(() => 
    editingUser ? "Nieuw wachtwoord (optioneel)" : "Voer wachtwoord in",
    [editingUser]
  );

  const isPasswordRequired = useMemo(() => !editingUser, [editingUser]);

  // Memoized team options
  const teamOptions = useMemo(() => 
    teams.map((team) => (
      <option key={team.id} value={team.id}>
        {team.name}
      </option>
    )),
    [teams]
  );

  // Memoized team selection value
  const teamSelectionValue = useMemo(() => 
    isTeamSelectionDisabled ? "" : (formData.selectedTeamId || ""),
    [isTeamSelectionDisabled, formData.selectedTeamId]
  );

  // Memoized team selection className
  const teamSelectionClassName = useMemo(() => 
    `modal__input ${isTeamSelectionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    [isTeamSelectionDisabled]
  );

  // Memoized team label
  const teamLabel = useMemo(() => (
    <>
      Team {isTeamSelectionDisabled && <span className="text-orange-600 text-sm">(niet beschikbaar voor deze rol)</span>}
    </>
  ), [isTeamSelectionDisabled]);

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      size="md"
      aria-describedby="user-modal-description"
      primaryAction={{
        label: submitButtonText,
        onClick: () => handleSubmit({ preventDefault: () => {} } as React.FormEvent),
        disabled: isLoading,
        variant: "primary",
        loading: isLoading,
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: handleCancel,
        disabled: isLoading,
        variant: "secondary",
      }}
    >
      <AppModalBody>
        <div id="user-modal-description" className="sr-only">
          {modalDescription}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Gebruikersnaam *</label>
            <Input
              placeholder="Voer gebruikersnaam in"
              className="modal__input"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">E-mail (optioneel)</label>
            <Input
              type="email"
              placeholder="E-mailadres (optioneel)"
              className="modal__input"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {/* Password */}
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">
              {passwordLabel}
            </label>
            <Input
              type="password"
              placeholder={passwordPlaceholder}
              className="modal__input"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={isLoading}
              minLength={6}
              required={isPasswordRequired}
            />
          </div>
          
          {/* Role */}
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">Rol *</label>
            <select
              className="modal__input"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as "admin" | "referee" | "player_manager")}
              disabled={isLoading}
              required
            >
              <option value="player_manager">Teamverantwoordelijke</option>
              <option value="admin">Administrator</option>
              <option value="referee">Scheidsrechter</option>
            </select>
          </div>
          
          {/* Team Selection */}
          <div className="space-y-2">
            <label className="text-purple-dark font-medium">
              {teamLabel}
            </label>
            <select
              className={teamSelectionClassName}
              value={teamSelectionValue}
              onChange={(e) => handleInputChange('selectedTeamId', e.target.value ? parseInt(e.target.value) : null)}
              disabled={isLoading || isTeamSelectionDisabled}
            >
              <option value="">Geen team</option>
              {teamOptions}
            </select>
          </div>

          {/* Password email note (appears in welcome email) */}
          {!editingUser && (
            <div className="space-y-2">
              <label className="text-purple-dark font-medium">Wachtwoord: </label>
              <Input
                placeholder="standaardwachtwoord"
                className="modal__input"
                value={passwordEmailNote ?? ''}
                onChange={(e) => onPasswordEmailNoteChange?.(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
        </form>
      </AppModalBody>
    </AppModal>
  );
};

export default UserModal;
