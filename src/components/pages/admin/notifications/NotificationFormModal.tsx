import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from '@/components/ui/app-modal';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  MessageSquare, 
  Users, 
  UserCheck, 
  Building2, 
  Calendar, 
  Search, 
  X, 
  ChevronDown,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type NotificationType = 'info' | 'warning' | 'success' | 'error';
type TargetMode = 'everyone' | 'roles' | 'users' | 'teams';
type PlayerManagerMode = 'all' | 'specific_teams';

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
  message: string;
  type: NotificationType;
  target_roles: string[];
  target_users: number[];
  target_teams: number[];
  player_manager_mode: PlayerManagerMode;
  player_manager_teams: number[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  duration: number;
}

interface NotificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData, targetMode: TargetMode) => Promise<void>;
  initialData?: FormData;
  initialTargetMode?: TargetMode;
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
  { value: 'admin', label: 'Admin' },
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'player_manager', label: 'Teamverantwoordelijke' }
];

const DEFAULT_FORM_DATA: FormData = {
  message: '',
  type: 'info',
  target_roles: [],
  target_users: [],
  target_teams: [],
  player_manager_mode: 'all',
  player_manager_teams: [],
  start_date: '',
  end_date: '',
  is_active: true,
  duration: 8
};

export const NotificationFormModal: React.FC<NotificationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialTargetMode = 'everyone',
  isEditing,
  users,
  teams
}) => {
  const [formData, setFormData] = useState<FormData>(initialData || DEFAULT_FORM_DATA);
  const [targetMode, setTargetMode] = useState<TargetMode>(initialTargetMode);
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [pmTeamSearch, setPmTeamSearch] = useState('');
  const [showScheduling, setShowScheduling] = useState(!!initialData?.start_date || !!initialData?.end_date);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData || DEFAULT_FORM_DATA);
      setTargetMode(initialTargetMode);
      setUserSearch('');
      setTeamSearch('');
      setPmTeamSearch('');
      setShowScheduling(!!initialData?.start_date || !!initialData?.end_date);
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

  const filteredTeams = useMemo(() => {
    if (!teamSearch) return teams;
    const search = teamSearch.toLowerCase();
    return teams.filter(t => t.team_name.toLowerCase().includes(search));
  }, [teams, teamSearch]);

  const filteredPmTeams = useMemo(() => {
    if (!pmTeamSearch) return teams;
    const search = pmTeamSearch.toLowerCase();
    return teams.filter(t => t.team_name.toLowerCase().includes(search));
  }, [teams, pmTeamSearch]);

  // Get selected items for chips
  const selectedUsers = useMemo(() => 
    users.filter(u => formData.target_users.includes(u.user_id)), 
    [users, formData.target_users]
  );

  const selectedTeams = useMemo(() => 
    teams.filter(t => formData.target_teams.includes(t.team_id)), 
    [teams, formData.target_teams]
  );

  const selectedPmTeams = useMemo(() => 
    teams.filter(t => formData.player_manager_teams.includes(t.team_id)), 
    [teams, formData.player_manager_teams]
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

  const removeTeam = (teamId: number) => {
    setFormData(prev => ({
      ...prev,
      target_teams: prev.target_teams.filter(id => id !== teamId)
    }));
  };

  const removePmTeam = (teamId: number) => {
    setFormData(prev => ({
      ...prev,
      player_manager_teams: prev.player_manager_teams.filter(id => id !== teamId)
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

  const selectAllTeams = () => {
    setFormData(prev => ({
      ...prev,
      target_teams: teams.map(t => t.team_id)
    }));
  };

  const clearAllTeams = () => {
    setFormData(prev => ({ ...prev, target_teams: [] }));
  };

  const isPlayerManagerSelected = formData.target_roles.includes('player_manager');

  // Get target summary for preview
  const getTargetSummary = useCallback(() => {
    switch (targetMode) {
      case 'everyone':
        return 'Alle ingelogde gebruikers';
      case 'roles':
        if (formData.target_roles.length === 0) return 'Geen rollen geselecteerd';
        const roleLabels = formData.target_roles.map(r => 
          ROLE_OPTIONS.find(ro => ro.value === r)?.label || r
        );
        if (isPlayerManagerSelected && formData.player_manager_mode === 'specific_teams') {
          return `${roleLabels.join(', ')} (${formData.player_manager_teams.length} teams)`;
        }
        return roleLabels.join(', ');
      case 'users':
        if (formData.target_users.length === 0) return 'Geen gebruikers geselecteerd';
        return `${formData.target_users.length} gebruiker(s)`;
      case 'teams':
        if (formData.target_teams.length === 0) return 'Geen teams geselecteerd';
        return `${formData.target_teams.length} team(s)`;
      default:
        return '';
    }
  }, [targetMode, formData, isPlayerManagerSelected]);

  const notificationTypeConfig = NOTIFICATION_TYPES.find(t => t.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal p-0 gap-0 flex flex-col">
        {/* Sticky Header */}
        <div className="modal__title sticky top-0 z-10 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--color-500)]" />
          {isEditing ? 'Notificatie Bewerken' : 'Nieuwe Notificatie'}
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
            
            {/* Section 1: Bericht */}
            <div className="space-y-4 p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-50)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                <MessageSquare className="w-4 h-4 text-[var(--color-500)]" />
                Bericht
              </div>
              
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                required
                placeholder="Voer het notificatie bericht in..."
                className="resize-none min-h-[80px]"
              />

              {/* Type Selection - Visual Buttons */}
              <div className="space-y-2">
                <Label className="text-xs text-[var(--color-600)]">Type notificatie</Label>
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
                  targetMode === 'everyone' ? "border-[var(--color-500)] bg-[var(--color-100)]" : "border-[var(--color-300)] hover:bg-[var(--color-100)]"
                )}>
                  <RadioGroupItem value="everyone" id="target-everyone" />
                  <div className="flex-1">
                    <span className="font-medium text-[var(--color-600)]">Iedereen</span>
                    <p className="text-xs text-[var(--color-500)]">Alle ingelogde gebruikers</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'roles' ? "border-[var(--color-500)] bg-[var(--color-100)]" : "border-[var(--color-300)] hover:bg-[var(--color-100)]"
                )}>
                  <RadioGroupItem value="roles" id="target-roles" />
                  <div className="flex-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--color-500)]" />
                    <div>
                      <span className="font-medium text-[var(--color-600)]">Specifieke rol(len)</span>
                      <p className="text-xs text-[var(--color-500)]">Admin, Scheidsrechter, Teamverantwoordelijke</p>
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

                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'teams' ? "border-[var(--color-500)] bg-[var(--color-100)]" : "border-[var(--color-300)] hover:bg-[var(--color-100)]"
                )}>
                  <RadioGroupItem value="teams" id="target-teams" />
                  <div className="flex-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--color-500)]" />
                    <div>
                      <span className="font-medium text-[var(--color-600)]">Specifieke team(s)</span>
                      <p className="text-xs text-[var(--color-500)]">Alle leden van geselecteerde teams</p>
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

                  {/* Player Manager Sub-options */}
                  {isPlayerManagerSelected && (
                    <div className="p-3 rounded-lg bg-[var(--color-100)] space-y-3">
                      <Label className="text-xs text-[var(--color-600)]">Welke teamverantwoordelijken?</Label>
                      <RadioGroup 
                        value={formData.player_manager_mode} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, player_manager_mode: v as PlayerManagerMode }))}
                        className="space-y-2"
                      >
                        <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                          <RadioGroupItem value="all" />
                          <span className="text-sm">Alle teamverantwoordelijken</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                          <RadioGroupItem value="specific_teams" />
                          <span className="text-sm">Van specifieke teams</span>
                        </label>
                      </RadioGroup>

                      {formData.player_manager_mode === 'specific_teams' && (
                        <div className="space-y-3 pt-2">
                          {/* Selected Teams Chips */}
                          {selectedPmTeams.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPmTeams.map(team => (
                                <Badge 
                                  key={team.team_id} 
                                  variant="secondary"
                                  className="pl-2 pr-1 py-1 gap-1"
                                >
                                  {team.team_name}
                                  <button
                                    type="button"
                                    onClick={() => removePmTeam(team.team_id)}
                                    className="hover:bg-destructive/20 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Zoek team..."
                              value={pmTeamSearch}
                              onChange={(e) => setPmTeamSearch(e.target.value)}
                              className="pl-9 h-11"
                            />
                          </div>
                          <ScrollArea className="h-28 border border-[var(--color-300)] rounded-lg bg-[var(--color-white)]">
                            <div className="p-1.5 space-y-0.5">
                              {filteredPmTeams.map(team => (
                                <label 
                                  key={team.team_id} 
                                  className="flex items-center gap-2 min-h-[36px] px-1.5 py-1 rounded hover:bg-[var(--color-100)] cursor-pointer"
                                >
                                  <Checkbox
                                    className="select-box"
                                    checked={formData.player_manager_teams.includes(team.team_id)}
                                    onCheckedChange={(checked) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        player_manager_teams: checked
                                          ? [...prev.player_manager_teams, team.team_id]
                                          : prev.player_manager_teams.filter(id => id !== team.team_id)
                                      }));
                                    }}
                                  />
                                  <span className="text-xs">{team.team_name}</span>
                                </label>
                              ))}
                              {filteredPmTeams.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                  Geen teams gevonden
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
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

              {/* Teams Sub-Selection */}
              {targetMode === 'teams' && (
                <div className="pl-4 border-l-2 border-[var(--color-400)] space-y-3 mt-3">
                  {/* Selected Teams Chips */}
                  {selectedTeams.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeams.map(team => (
                        <Badge 
                          key={team.team_id} 
                          variant="secondary"
                          className="pl-2 pr-1 py-1 gap-1"
                        >
                          {team.team_name}
                          <button
                            type="button"
                            onClick={() => removeTeam(team.team_id)}
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
                    <button type="button" className="btn btn--secondary text-xs py-1 px-2" onClick={selectAllTeams}>
                      Selecteer alle
                    </button>
                    {selectedTeams.length > 0 && (
                      <button type="button" className="btn btn--ghost text-xs py-1 px-2" onClick={clearAllTeams}>
                        Wis selectie
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek team..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <ScrollArea className="h-32 border border-[var(--color-300)] rounded-lg bg-[var(--color-white)]">
                    <div className="p-1.5 space-y-0.5">
                      {filteredTeams.map(team => (
                        <label 
                          key={team.team_id} 
                          className="flex items-center gap-2 min-h-[40px] px-1.5 py-1 rounded hover:bg-[var(--color-100)] cursor-pointer"
                        >
                          <Checkbox
                            className="select-box shrink-0"
                            checked={formData.target_teams.includes(team.team_id)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                target_teams: checked
                                  ? [...prev.target_teams, team.team_id]
                                  : prev.target_teams.filter(id => id !== team.team_id)
                              }));
                            }}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-medium text-[var(--color-700)] truncate">
                              {team.team_name}
                            </span>
                            <span className="text-[10px] text-[var(--color-500)]">
                              Teamverantwoordelijke
                            </span>
                          </div>
                        </label>
                      ))}
                      {filteredTeams.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          Geen teams gevonden
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Section 3: Planning (Collapsible) */}
            <Collapsible open={showScheduling} onOpenChange={setShowScheduling}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--color-300)] bg-[var(--color-50)] hover:bg-[var(--color-100)] transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-600)]">
                    <Calendar className="w-4 h-4 text-[var(--color-500)]" />
                    Planning
                    <span className="text-xs text-[var(--color-500)] font-normal">(optioneel)</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-[var(--color-500)] transition-transform",
                    showScheduling && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 rounded-b-xl border border-t-0 border-[var(--color-300)] bg-[var(--color-50)] space-y-4">
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
                      <Label htmlFor="end_date" className="text-xs text-[var(--color-600)]">Eind datum</Label>
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
              </CollapsibleContent>
            </Collapsible>

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
                {formData.is_active ? 'Notificatie is zichtbaar' : 'Notificatie is verborgen'}
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
      </DialogContent>
    </Dialog>
  );
};
