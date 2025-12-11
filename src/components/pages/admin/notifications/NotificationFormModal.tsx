import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-500' },
  { value: 'warning', label: 'Waarschuwing', icon: AlertTriangle, color: 'bg-amber-500' },
  { value: 'success', label: 'Succes', icon: CheckCircle2, color: 'bg-green-500' },
  { value: 'error', label: 'Fout', icon: XCircle, color: 'bg-red-500' }
] as const;

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'player_manager', label: 'Teamverantwoordelijke' }
];

const DURATION_PRESETS = [5, 8, 10, 15, 30];

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
      <DialogContent className="w-full h-[100dvh] max-w-none sm:h-auto sm:max-h-[90vh] sm:max-w-2xl p-0 gap-0 flex flex-col">
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-4 py-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {isEditing ? 'Notificatie Bewerken' : 'Nieuwe Notificatie'}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
            
            {/* Section 1: Bericht */}
            <div className="space-y-4 p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageSquare className="w-4 h-4 text-primary" />
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
                <Label className="text-xs text-muted-foreground">Type notificatie</Label>
                <div className="grid grid-cols-4 gap-2">
                  {NOTIFICATION_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                          "hover:bg-accent/50 active:scale-95",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border bg-background"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", type.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Slider with Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Weergaveduur</Label>
                  <span className="text-sm font-medium">{formData.duration} sec</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duration: preset }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        formData.duration === preset
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {preset}s
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={3}
                  max={60}
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Section 2: Doelgroep */}
            <div className="space-y-4 p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="w-4 h-4 text-primary" />
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
                  targetMode === 'everyone' ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                )}>
                  <RadioGroupItem value="everyone" id="target-everyone" />
                  <div className="flex-1">
                    <span className="font-medium">Iedereen</span>
                    <p className="text-xs text-muted-foreground">Alle ingelogde gebruikers</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'roles' ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                )}>
                  <RadioGroupItem value="roles" id="target-roles" />
                  <div className="flex-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Specifieke rol(len)</span>
                      <p className="text-xs text-muted-foreground">Admin, Scheidsrechter, Teamverantwoordelijke</p>
                    </div>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'users' ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                )}>
                  <RadioGroupItem value="users" id="target-users" />
                  <div className="flex-1 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Specifieke gebruiker(s)</span>
                      <p className="text-xs text-muted-foreground">Selecteer individuele gebruikers</p>
                    </div>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  targetMode === 'teams' ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                )}>
                  <RadioGroupItem value="teams" id="target-teams" />
                  <div className="flex-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Specifieke team(s)</span>
                      <p className="text-xs text-muted-foreground">Alle leden van geselecteerde teams</p>
                    </div>
                  </div>
                </label>
              </RadioGroup>

              {/* Roles Sub-Selection */}
              {targetMode === 'roles' && (
                <div className="pl-4 border-l-2 border-primary/30 space-y-3 mt-3">
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
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-accent/50"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>

                  {/* Player Manager Sub-options */}
                  {isPlayerManagerSelected && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                      <Label className="text-xs text-muted-foreground">Welke teamverantwoordelijken?</Label>
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
                          <ScrollArea className="h-32 border rounded-lg bg-background">
                            <div className="p-2 space-y-1">
                              {filteredPmTeams.map(team => (
                                <label 
                                  key={team.team_id} 
                                  className="flex items-center gap-3 min-h-[44px] px-2 rounded hover:bg-accent/50 cursor-pointer"
                                >
                                  <Checkbox
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
                                  <span className="text-sm">{team.team_name}</span>
                                </label>
                              ))}
                              {filteredPmTeams.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
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
                <div className="pl-4 border-l-2 border-primary/30 space-y-3 mt-3">
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
                    <Button type="button" variant="outline" size="sm" onClick={selectAllUsers}>
                      Selecteer alle
                    </Button>
                    {selectedUsers.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearAllUsers}>
                        Wis selectie
                      </Button>
                    )}
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
                  <ScrollArea className="h-40 sm:h-48 border rounded-lg bg-background">
                    <div className="p-2 space-y-1">
                      {filteredUsers.map(user => (
                        <label 
                          key={user.user_id} 
                          className="flex items-center gap-3 min-h-[44px] px-2 rounded hover:bg-accent/50 cursor-pointer"
                        >
                          <Checkbox
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
                          <span className="text-sm flex-1">{user.username}</span>
                          <Badge variant="outline" className="text-xs">
                            {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                          </Badge>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Geen gebruikers gevonden
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Teams Sub-Selection */}
              {targetMode === 'teams' && (
                <div className="pl-4 border-l-2 border-primary/30 space-y-3 mt-3">
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
                    <Button type="button" variant="outline" size="sm" onClick={selectAllTeams}>
                      Selecteer alle
                    </Button>
                    {selectedTeams.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearAllTeams}>
                        Wis selectie
                      </Button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek team..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                  <ScrollArea className="h-40 sm:h-48 border rounded-lg bg-background">
                    <div className="p-2 space-y-1">
                      {filteredTeams.map(team => (
                        <label 
                          key={team.team_id} 
                          className="flex items-center gap-3 min-h-[44px] px-2 rounded hover:bg-accent/50 cursor-pointer"
                        >
                          <Checkbox
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
                          <span className="text-sm">{team.team_name}</span>
                        </label>
                      ))}
                      {filteredTeams.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
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
                  className="w-full flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    Planning
                    <span className="text-xs text-muted-foreground font-normal">(optioneel)</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    showScheduling && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 rounded-b-xl border border-t-0 bg-card space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-xs text-muted-foreground">Start datum</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-xs text-muted-foreground">Eind datum</Label>
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
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label className="cursor-pointer font-medium">Actief</Label>
              </div>
              <span className="text-xs text-muted-foreground">
                {formData.is_active ? 'Notificatie is zichtbaar' : 'Notificatie is verborgen'}
              </span>
            </div>

            {/* Live Preview */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Eye className="w-4 h-4 text-primary" />
                Preview
              </div>
              
              <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                formData.type === 'info' && "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
                formData.type === 'warning' && "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
                formData.type === 'success' && "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
                formData.type === 'error' && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
              )}>
                <div className="flex items-start gap-3">
                  {notificationTypeConfig && (
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", notificationTypeConfig.color)}>
                      <notificationTypeConfig.icon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {formData.message || <span className="text-muted-foreground italic">Voer een bericht in...</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Zichtbaar voor: {getTargetSummary()}
              </p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background border-t px-4 py-4 sm:px-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto h-12 sm:h-10"
            >
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.message}
              className="w-full sm:w-auto h-12 sm:h-10"
            >
              {isSubmitting ? 'Opslaan...' : (isEditing ? 'Bijwerken' : 'Aanmaken')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
