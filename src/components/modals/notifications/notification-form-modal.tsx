import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppModal } from '@/components/modals/base/app-modal';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  MessageSquare, 
  Users, 
  UserCheck, 
  Calendar, 
  Search, 
  X, 
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type NotificationType = 'info' | 'warning' | 'success' | 'error';
type TargetMode = 'roles' | 'users';

interface User {
  user_id: number;
  username: string;
  role: string;
}

interface Team {
  team_id: number;
  team_name: string;
}

interface FormData {
  title?: string;
  message: string;
  type: NotificationType;
  target_roles: string[];
  target_users: number[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  [key: string]: any; // Allow extra fields for backwards compat
}

interface NotificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any, targetMode: TargetMode) => Promise<void>;
  initialData?: FormData;
  initialTargetMode?: string;
  isEditing: boolean;
  users: User[];
  teams: Team[];
}

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info', icon: Info, color: 'bg-[var(--color-500)]' },
  { value: 'warning', label: 'Waarsch.', icon: AlertTriangle, color: 'bg-[var(--color-700)]' },
  { value: 'success', label: 'Succes', icon: CheckCircle2, color: 'bg-[var(--color-success)]' },
  { value: 'error', label: 'Fout', icon: XCircle, color: 'bg-[var(--color-destructive)]' }
] as const;

const ROLE_OPTIONS = [
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'player_manager', label: 'Teamverantwoordelijke' }
];

const DEFAULT_FORM_DATA: FormData = {
  title: '',
  message: '',
  type: 'info',
  target_roles: [],
  target_users: [],
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  is_active: true,
};

export const NotificationFormModal: React.FC<NotificationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialTargetMode = 'roles',
  isEditing,
  users,
}) => {
  const [formData, setFormData] = useState<FormData>(initialData || DEFAULT_FORM_DATA);
  const [targetMode, setTargetMode] = useState<TargetMode>(
    (initialTargetMode === 'roles' || initialTargetMode === 'users') ? initialTargetMode : 'roles'
  );
  const [userSearch, setUserSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData || DEFAULT_FORM_DATA);
      setTargetMode(
        (initialTargetMode === 'roles' || initialTargetMode === 'users') ? initialTargetMode : 'roles'
      );
      setUserSearch('');
    }
  }, [isOpen, initialData, initialTargetMode]);

  // Filtered lists
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const search = userSearch.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(search) || 
      u.role.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

  // Get selected items for chips
  const selectedUsers = useMemo(() => 
    users.filter(u => formData.target_users.includes(u.user_id)), 
    [users, formData.target_users]
  );

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData, targetMode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeUser = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      target_users: prev.target_users.filter(id => id !== userId)
    }));
  };

  const toggleRole = (roleValue: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(roleValue)
        ? prev.target_roles.filter(r => r !== roleValue)
        : [...prev.target_roles, roleValue]
    }));
  };

  const selectAllUsers = () => {
    setFormData(prev => ({
      ...prev,
      target_users: users.map(u => u.user_id)
    }));
  };

  const clearAllUsers = () => {
    setFormData(prev => ({ ...prev, target_users: [] }));
  };

  // Get target summary for preview
  const getTargetSummary = useCallback(() => {
    switch (targetMode) {
      case 'roles':
        if (formData.target_roles.length === 0) return 'Geen rollen geselecteerd';
        const roleLabels = formData.target_roles.map(r => 
          ROLE_OPTIONS.find(ro => ro.value === r)?.label || r
        );
        return roleLabels.join(', ');
      case 'users':
        if (formData.target_users.length === 0) return 'Geen gebruikers geselecteerd';
        return `${formData.target_users.length} gebruiker(s)`;
      default:
        return '';
    }
  }, [targetMode, formData]);

  const notificationTypeConfig = NOTIFICATION_TYPES.find(t => t.value === formData.type);

  return (
    <AppModal
      open={isOpen}
      onOpenChange={onClose}
      title={isEditing ? 'Bericht Bewerken' : 'Nieuw Bericht'}
      size="lg"
      variant="default"
    >

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
            
            {/* Section 1: Bericht */}
            <div className="space-y-4 p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-50)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                <MessageSquare className="w-4 h-4 text-[var(--color-500)]" />
                Bericht
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs text-[var(--color-600)]">Onderwerp (optioneel)</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Onderwerp van het bericht..."
                  className="h-11"
                />
              </div>

              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                required
                placeholder="Voer het bericht in..."
                className="resize-none min-h-[80px]"
              />

              {/* Type Selection - Visual Buttons */}
              <div className="space-y-2">
                <Label className="text-xs text-[var(--color-600)]">Type bericht</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {NOTIFICATION_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all min-w-0",
                          "hover:bg-[var(--color-100)] active:scale-95",
                          isSelected 
                            ? "border-[var(--color-500)] bg-[var(--color-100)]" 
                            : "border-[var(--color-300)] bg-[var(--color-white)]"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", type.color)}>
                          <Icon className="w-4 h-4 text-[var(--color-white)]" />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-600)] truncate max-w-full">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Section 2: Doelgroep */}
            <div className="space-y-4 p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-50)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                <Users className="w-4 h-4 text-[var(--color-500)]" />
                Doelgroep
              </div>

              {/* Radio Selection for Target Mode */}
              <RadioGroup 
                value={targetMode} 
                onValueChange={(v) => setTargetMode(v as TargetMode)}
                className="space-y-2"
              >
                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'roles' ? "border-[var(--color-500)] bg-[var(--color-100)]" : "border-[var(--color-300)] hover:bg-[var(--color-100)]"
                )}>
                  <RadioGroupItem value="roles" id="target-roles" />
                  <div className="flex-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--color-500)]" />
                    <div>
                      <span className="font-medium text-[var(--color-600)]">Op basis van rol</span>
                      <p className="text-xs text-[var(--color-500)]">Scheidsrechter, Teamverantwoordelijke</p>
                    </div>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'users' ? "border-[var(--color-500)] bg-[var(--color-100)]" : "border-[var(--color-300)] hover:bg-[var(--color-100)]"
                )}>
                  <RadioGroupItem value="users" id="target-users" />
                  <div className="flex-1 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[var(--color-500)]" />
                    <div>
                      <span className="font-medium text-[var(--color-600)]">Specifieke gebruiker(s)</span>
                      <p className="text-xs text-[var(--color-500)]">Selecteer individuele gebruikers</p>
                    </div>
                  </div>
                </label>
              </RadioGroup>

              {/* Roles Sub-Selection */}
              {targetMode === 'roles' && (
                <div className="pl-4 border-l-2 border-[var(--color-400)] space-y-3 mt-3">
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map(role => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleRole(role.value)}
                        className={cn(
                          "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                          "min-h-[44px] active:scale-95",
                          formData.target_roles.includes(role.value)
                            ? "border-[var(--color-500)] bg-[var(--color-500)] text-[var(--color-white)]"
                            : "border-[var(--color-300)] bg-[var(--color-white)] hover:bg-[var(--color-100)] text-[var(--color-600)]"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Sub-Selection */}
              {targetMode === 'users' && (
                <div className="pl-4 border-l-2 border-[var(--color-400)] space-y-3 mt-3">
                  {/* Selected Users Chips */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUsers.map(user => (
                        <Badge 
                          key={user.user_id} 
                          variant="secondary"
                          className="pl-2 pr-1 py-1 gap-1"
                        >
                          {user.username}
                          <button
                            type="button"
                            onClick={() => removeUser(user.user_id)}
                            className="hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button type="button" className="btn btn--secondary text-xs py-1 px-2" onClick={selectAllUsers}>
                      Selecteer alle
                    </button>
                    {selectedUsers.length > 0 && (
                      <button type="button" className="btn btn--ghost text-xs py-1 px-2" onClick={clearAllUsers}>
                        Wis selectie
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek gebruiker..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <ScrollArea className="h-32 border border-[var(--color-300)] rounded-lg bg-[var(--color-white)]">
                    <div className="p-1.5 space-y-0.5">
                      {filteredUsers.map(user => (
                        <label 
                          key={user.user_id} 
                          className="flex items-center gap-2 min-h-[40px] px-1.5 py-1 rounded hover:bg-[var(--color-100)] cursor-pointer"
                        >
                          <Checkbox
                            className="select-box shrink-0"
                            checked={formData.target_users.includes(user.user_id)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                target_users: checked
                                  ? [...prev.target_users, user.user_id]
                                  : prev.target_users.filter(id => id !== user.user_id)
                              }));
                            }}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-[var(--color-700)] truncate">
                              {user.username}
                            </span>
                            <span className="text-[10px] text-[var(--color-500)] truncate">
                              {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                            </span>
                          </div>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          Geen gebruikers gevonden
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Section 3: Planning */}
            <div className="space-y-4 p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-50)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                <Calendar className="w-4 h-4 text-[var(--color-500)]" />
                Planning
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-xs text-[var(--color-600)]">Start datum</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-xs text-[var(--color-600)]">Eind datum (optioneel)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-50)]">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label className="cursor-pointer font-medium text-[var(--color-600)]">Actief</Label>
              </div>
              <span className="text-xs text-[var(--color-500)]">
                {formData.is_active ? 'Bericht is zichtbaar' : 'Bericht is verborgen'}
              </span>
            </div>

            {/* Live Preview */}
            <div className="space-y-3 p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-100)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                <Eye className="w-4 h-4 text-[var(--color-500)]" />
                Preview
              </div>
              
              <div className={cn(
                "p-4 rounded-lg border-2 shadow-sm",
                formData.type === 'info' && "bg-[var(--color-500)] border-[var(--color-600)]",
                formData.type === 'warning' && "bg-[var(--color-700)] border-[var(--color-800)]",
                formData.type === 'success' && "bg-[hsl(var(--success))] border-[hsl(var(--success))]",
                formData.type === 'error' && "bg-[hsl(var(--destructive))] border-[hsl(var(--destructive))]"
              )}>
                <div className="flex items-start gap-3">
                  {notificationTypeConfig && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/20">
                      <notificationTypeConfig.icon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {formData.title && (
                      <p className="text-sm font-semibold text-white mb-1">{formData.title}</p>
                    )}
                    <p className="text-sm text-white">
                      {formData.message || <span className="text-white/60 italic">Voer een bericht in...</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-[var(--color-500)]">
                Zichtbaar voor: {getTargetSummary()}
              </p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="modal__actions sticky bottom-0">
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.message}
              className="btn btn--primary"
            >
              {isSubmitting ? 'Opslaan...' : (isEditing ? 'Bijwerken' : 'Aanmaken')}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn--secondary"
            >
              Annuleren
            </button>
          </div>
        </form>
    </AppModal>
  );
};
