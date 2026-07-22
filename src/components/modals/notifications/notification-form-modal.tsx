import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppModal } from '@/components/modals/base/app-modal';
import { Badge } from '@/components/ui/badge';
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
  Eye,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type NotificationType = 'info' | 'warning' | 'success' | 'error';
type TargetMode = 'roles' | 'users';

interface User {
  user_id: number;
  username: string;
  role: string;
  email?: string | null;
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
  send_email: boolean;
  [key: string]: any;
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

const USER_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "player_manager", label: "Teamverantwoordelijke" },
  { value: "referee", label: "Scheidsrechter" },
] as const;

function getRoleLabel(role: string): string {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

const DEFAULT_FORM_DATA: FormData = {
  title: '',
  message: '',
  type: 'info',
  target_roles: [],
  target_users: [],
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  send_email: false,
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
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData || DEFAULT_FORM_DATA);
      setTargetMode(
        (initialTargetMode === 'roles' || initialTargetMode === 'users') ? initialTargetMode : 'roles'
      );
      setUserSearch('');
      setRoleFilters([]);
    }
  }, [isOpen, initialData, initialTargetMode]);

  const toggleRoleFilter = useCallback((roleValue: string) => {
    setRoleFilters((prev) =>
      prev.includes(roleValue)
        ? prev.filter((role) => role !== roleValue)
        : [...prev, roleValue],
    );
  }, []);

  // Filtered lists
  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilters.length > 0) {
      result = result.filter((user) => roleFilters.includes(user.role));
    }

    if (!userSearch.trim()) return result;

    const search = userSearch.trim().toLowerCase();
    return result.filter(
      (user) =>
        user.username.toLowerCase().includes(search) ||
        getRoleLabel(user.role).toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search),
    );
  }, [users, userSearch, roleFilters]);

  // Get selected items for chips
  const selectedUsers = useMemo(() => 
    users.filter(u => formData.target_users.includes(u.user_id)), 
    [users, formData.target_users]
  );

  const hasTargetSelection = useMemo(() => {
    if (targetMode === 'roles') {
      return formData.target_roles.length > 0;
    }
    return formData.target_users.length > 0;
  }, [targetMode, formData.target_roles, formData.target_users]);

  const emailRecipientCount = useMemo(() => {
    if (!hasTargetSelection) return 0;

    const candidates =
      targetMode === 'users'
        ? selectedUsers
        : users.filter((user) => formData.target_roles.includes(user.role));

    const uniqueEmails = new Set(
      candidates
        .map((user) => user.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    );

    return uniqueEmails.size;
  }, [hasTargetSelection, targetMode, selectedUsers, users, formData.target_roles]);

  const submitDisabled =
    isSubmitting ||
    !formData.message.trim() ||
    !hasTargetSelection ||
    (formData.send_email && emailRecipientCount === 0);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (submitDisabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData, targetMode);
      onClose();
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
      target_users: [...new Set([...prev.target_users, ...filteredUsers.map(u => u.user_id)])]
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
        const roleLabels = formData.target_roles.map(r => getRoleLabel(r));
        return roleLabels.join(', ');
      case 'users':
        if (formData.target_users.length === 0) return 'Geen gebruikers geselecteerd';
        return `${formData.target_users.length} gebruiker(s)`;
      default:
        return '';
    }
  }, [targetMode, formData]);

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={isEditing ? "Bericht bewerken" : "Nieuw bericht"}
      size="lg"
      primaryAction={{
        label: isSubmitting ? "Opslaan…" : isEditing ? "Bijwerken" : "Aanmaken",
        onClick: () => void handleSave(),
        variant: "primary",
        loading: isSubmitting,
        disabled: submitDisabled,
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: onClose,
        variant: "secondary",
        disabled: isSubmitting,
      }}
    >
        <form id="notification-form" onSubmit={(e) => void handleSave(e)} className="space-y-4 sm:space-y-6">
            
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
                      <p className="text-xs text-[var(--color-500)]">Scheidsrechter, Teamverantwoordelijke, Admin</p>
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
                    {USER_ROLE_OPTIONS.map(role => (
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
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn--secondary text-xs py-1 px-2 min-h-[44px]" onClick={selectAllUsers}>
                      Selecteer zichtbare ({filteredUsers.length})
                    </button>
                    {selectedUsers.length > 0 && (
                      <button type="button" className="btn btn--ghost text-xs py-1 px-2 min-h-[44px]" onClick={clearAllUsers}>
                        Wis selectie
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-[var(--color-600)]">Filter op rol</Label>
                    <div className="flex flex-wrap gap-2">
                      {USER_ROLE_OPTIONS.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => toggleRoleFilter(role.value)}
                          className={cn(
                            "px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-[44px]",
                            roleFilters.includes(role.value)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-primary/20 bg-card hover:bg-muted text-brand-dark",
                          )}
                          aria-pressed={roleFilters.includes(role.value)}
                        >
                          {role.label}
                        </button>
                      ))}
                      {roleFilters.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRoleFilters([])}
                          className="px-3 py-2 rounded-lg border border-primary/20 text-sm font-medium min-h-[44px] hover:bg-muted text-muted-foreground"
                        >
                          Alle rollen
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek gebruiker..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                  <ScrollArea className="h-48 sm:h-56 border border-primary/20 rounded-lg bg-card">
                    <div className="p-2 space-y-0.5">
                      {filteredUsers.map(user => (
                        <label 
                          key={user.user_id} 
                          className="flex items-center gap-2 min-h-[44px] px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
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
                            <span className="text-sm font-medium text-brand-dark truncate">
                              {user.username}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Geen gebruikers gevonden
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {hasTargetSelection && (
                <div className="space-y-3 rounded-lg border border-primary/15 bg-card p-3">
                  <label
                    htmlFor="send-email"
                    className="flex min-h-[44px] cursor-pointer items-start gap-3"
                  >
                    <Checkbox
                      id="send-email"
                      className="mt-1 shrink-0"
                      checked={formData.send_email}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, send_email: checked === true }))
                      }
                      disabled={emailRecipientCount === 0}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-2 text-sm font-medium text-brand-dark">
                        <Mail className="h-4 w-4 text-primary" aria-hidden />
                        Ook per e-mail versturen
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {emailRecipientCount > 0
                          ? `Verstuurt dit bericht naar ${emailRecipientCount} e-mailadres${emailRecipientCount === 1 ? "" : "sen"} in de geselecteerde doelgroep.`
                          : "Geen geselecteerde ontvangers met een e-mailadres."}
                      </p>
                    </div>
                  </label>
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

            {/* Live Preview */}
            <div className="space-y-3 p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-100)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                <Eye className="w-4 h-4 text-[var(--color-500)]" />
                Preview
              </div>
              
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    {formData.title && (
                      <p className="mb-1 text-sm font-semibold text-brand-dark">{formData.title}</p>
                    )}
                    <p className="text-sm text-foreground">
                      {formData.message || <span className="italic text-muted-foreground">Voer een bericht in…</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-[var(--color-500)]">
                Zichtbaar voor: {getTargetSummary()}
                {formData.send_email && emailRecipientCount > 0
                  ? ` · E-mail naar ${emailRecipientCount} ontvanger${emailRecipientCount === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
        </form>
    </AppModal>
  );
};
