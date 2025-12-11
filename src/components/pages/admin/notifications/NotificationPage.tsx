import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { notificationService, type Notification } from '@/services/notificationService';
import { Plus, Edit, Trash2, Users, UserCheck, Building2, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Informatie' },
  { value: 'warning', label: 'Waarschuwing' },
  { value: 'success', label: 'Succes' },
  { value: 'error', label: 'Fout' }
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'referee', label: 'Scheidsrechter' },
  { value: 'player_manager', label: 'Teamverantwoordelijke' }
];

type TargetType = 'roles' | 'users' | 'teams';
type PlayerManagerMode = 'all' | 'specific_teams';

const DEFAULT_FORM_DATA = {
  message: '',
  type: 'info' as 'info' | 'warning' | 'success' | 'error',
  target_roles: [] as string[],
  target_users: [] as number[],
  target_teams: [] as number[],
  player_manager_mode: 'all' as PlayerManagerMode,
  player_manager_teams: [] as number[],
  start_date: '',
  end_date: '',
  is_active: true,
  duration: 8
};

const NotificationPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<typeof DEFAULT_FORM_DATA>(DEFAULT_FORM_DATA);
  const [targetType, setTargetType] = useState<TargetType>('roles');
  
  // Users and teams for targeting
  const [users, setUsers] = useState<Array<{ user_id: number; username: string; role: string }>>([]);
  const [teams, setTeams] = useState<Array<{ team_id: number; team_name: string }>>([]);
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [pmTeamSearch, setPmTeamSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationsData, usersData, teamsData] = await Promise.all([
        notificationService.getAllNotifications(),
        notificationService.getAllUsers(),
        notificationService.getAllTeams()
      ]);
      setNotifications(notificationsData);
      setUsers(usersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Kon gegevens niet laden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingNotification(null);
    setTargetType('roles');
    setUserSearch('');
    setTeamSearch('');
    setPmTeamSearch('');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const notificationData = {
        setting_category: 'notifications',
        setting_name: editingNotification ? editingNotification.setting_name : `notification_${Date.now()}`,
        setting_value: {
          message: formData.message,
          type: formData.type,
          target_roles: targetType === 'roles' ? formData.target_roles : [],
          target_users: targetType === 'users' ? formData.target_users : [],
          target_teams: targetType === 'teams' ? formData.target_teams : [],
          player_manager_mode: formData.target_roles.includes('player_manager') ? formData.player_manager_mode : undefined,
          player_manager_teams: formData.target_roles.includes('player_manager') && formData.player_manager_mode === 'specific_teams' 
            ? formData.player_manager_teams 
            : [],
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          duration: formData.duration
        },
        is_active: formData.is_active
      };

      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, notificationData);
        toast({ title: 'Succes', description: 'Notificatie bijgewerkt' });
      } else {
        await notificationService.createNotification(notificationData);
        toast({ title: 'Succes', description: 'Notificatie aangemaakt' });
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie niet opslaan',
        variant: 'destructive'
      });
    }
  }, [formData, targetType, editingNotification, toast, resetForm, loadData]);

  const handleEdit = useCallback((notification: Notification) => {
    setEditingNotification(notification);
    const sv = notification.setting_value;
    
    // Determine target type based on what's set
    let detectedTargetType: TargetType = 'roles';
    if (sv.target_users && sv.target_users.length > 0) {
      detectedTargetType = 'users';
    } else if (sv.target_teams && sv.target_teams.length > 0) {
      detectedTargetType = 'teams';
    }
    
    setTargetType(detectedTargetType);
    setFormData({
      message: sv.message,
      type: sv.type as 'info' | 'warning' | 'success' | 'error',
      target_roles: sv.target_roles || [],
      target_users: sv.target_users || [],
      target_teams: sv.target_teams || [],
      player_manager_mode: sv.player_manager_mode || 'all',
      player_manager_teams: sv.player_manager_teams || [],
      start_date: sv.start_date || '',
      end_date: sv.end_date || '',
      is_active: notification.is_active,
      duration: sv.duration || 8
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Weet je zeker dat je deze notificatie wilt verwijderen?')) return;
    
    try {
      await notificationService.deleteNotification(id);
      toast({ title: 'Succes', description: 'Notificatie verwijderd' });
      await loadData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Kon notificatie niet verwijderen',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  const toggleActive = useCallback(async (notification: Notification) => {
    try {
      await notificationService.toggleNotificationStatus(notification.id, !notification.is_active);
      toast({
        title: 'Succes',
        description: `Notificatie ${!notification.is_active ? 'geactiveerd' : 'gedeactiveerd'}`
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling notification status:', error);
      toast({
        title: 'Error',
        description: 'Kon status niet wijzigen',
        variant: 'destructive'
      });
    }
  }, [toast, loadData]);

  const getTypeBadgeVariant = useCallback((type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  }, []);

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

  const getTargetDescription = (notification: Notification) => {
    const sv = notification.setting_value;
    if (sv.target_users && sv.target_users.length > 0) {
      const userNames = sv.target_users.map(uid => 
        users.find(u => u.user_id === uid)?.username || `User ${uid}`
      );
      return { type: 'users', items: userNames };
    }
    if (sv.target_teams && sv.target_teams.length > 0) {
      const teamNames = sv.target_teams.map(tid => 
        teams.find(t => t.team_id === tid)?.team_name || `Team ${tid}`
      );
      return { type: 'teams', items: teamNames };
    }
    if (sv.target_roles && sv.target_roles.length > 0) {
      const items = sv.target_roles.map(r => {
        const label = ROLE_OPTIONS.find(ro => ro.value === r)?.label || r;
        // Add extra info for player_manager with specific teams
        if (r === 'player_manager' && sv.player_manager_mode === 'specific_teams' && sv.player_manager_teams?.length) {
          return `${label} (${sv.player_manager_teams.length} teams)`;
        }
        return label;
      });
      return { type: 'roles', items };
    }
    return { type: 'none', items: [] };
  };

  const isPlayerManagerSelected = formData.target_roles.includes('player_manager');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Notificaties</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn btn--primary w-full sm:w-auto" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Notificatie
            </Button>
          </DialogTrigger>
          <DialogContent className="modal w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl">
                {editingNotification ? 'Notificatie Bewerken' : 'Nieuwe Notificatie'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingNotification ? 'Bewerk de notificatie details' : 'Maak een nieuwe notificatie aan'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Bericht</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  required
                  placeholder="Voer het notificatie bericht in..."
                  className="resize-none"
                />
              </div>
              
              {/* Type & Duration - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
                  >
                    <SelectTrigger className="h-11 sm:h-10">
                      <SelectValue placeholder="Selecteer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duur (sec)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={3}
                    max={60}
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 8 }))}
                    className="h-11 sm:h-10"
                  />
                </div>
              </div>

              {/* Target Selection */}
              <div className="space-y-3">
                <Label>Doelgroep</Label>
                <Tabs value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
                  <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10">
                    <TabsTrigger value="roles" className="flex items-center justify-center gap-1.5 px-2 text-xs sm:text-sm min-h-[40px] sm:min-h-0">
                      <Users className="w-4 h-4 shrink-0" />
                      <span className="hidden xs:inline sm:inline">Rollen</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center justify-center gap-1.5 px-2 text-xs sm:text-sm min-h-[40px] sm:min-h-0">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span className="hidden xs:inline sm:inline">Gebruikers</span>
                    </TabsTrigger>
                    <TabsTrigger value="teams" className="flex items-center justify-center gap-1.5 px-2 text-xs sm:text-sm min-h-[40px] sm:min-h-0">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span className="hidden xs:inline sm:inline">Teams</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="roles" className="mt-3 space-y-3">
                    <div className="space-y-2 border rounded-lg p-3">
                      {ROLE_OPTIONS.map(role => (
                        <div key={role.value} className="flex items-center space-x-3 min-h-[44px] sm:min-h-0">
                          <Checkbox
                            id={`role-${role.value}`}
                            checked={formData.target_roles.includes(role.value)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                target_roles: checked
                                  ? [...prev.target_roles, role.value]
                                  : prev.target_roles.filter(r => r !== role.value)
                              }));
                            }}
                          />
                          <Label htmlFor={`role-${role.value}`} className="cursor-pointer flex-1 py-2">
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Player Manager Sub-selection */}
                    {isPlayerManagerSelected && (
                      <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                        <Label className="text-sm font-medium">Teamverantwoordelijke specificatie</Label>
                        <RadioGroup 
                          value={formData.player_manager_mode} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, player_manager_mode: v as PlayerManagerMode }))}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-3 min-h-[44px] sm:min-h-0">
                            <RadioGroupItem value="all" id="pm-all" />
                            <Label htmlFor="pm-all" className="cursor-pointer flex-1 py-2">
                              Alle teamverantwoordelijken
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 min-h-[44px] sm:min-h-0">
                            <RadioGroupItem value="specific_teams" id="pm-specific" />
                            <Label htmlFor="pm-specific" className="cursor-pointer flex-1 py-2">
                              Specifieke teams
                            </Label>
                          </div>
                        </RadioGroup>
                        
                        {formData.player_manager_mode === 'specific_teams' && (
                          <div className="space-y-2 pt-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Zoek team..."
                                value={pmTeamSearch}
                                onChange={(e) => setPmTeamSearch(e.target.value)}
                                className="pl-9 h-11 sm:h-10"
                              />
                            </div>
                            <ScrollArea className="h-32 sm:h-40 border rounded-lg bg-background">
                              <div className="p-2 space-y-1">
                                {filteredPmTeams.map(team => (
                                  <div key={team.team_id} className="flex items-center space-x-3 min-h-[40px]">
                                    <Checkbox
                                      id={`pm-team-${team.team_id}`}
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
                                    <Label htmlFor={`pm-team-${team.team_id}`} className="cursor-pointer flex-1 text-sm">
                                      {team.team_name}
                                    </Label>
                                  </div>
                                ))}
                                {filteredPmTeams.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    Geen teams gevonden
                                  </p>
                                )}
                              </div>
                            </ScrollArea>
                            {formData.player_manager_teams.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {formData.player_manager_teams.length} team(s) geselecteerd
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="users" className="mt-3">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Zoek gebruiker..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-9 h-11 sm:h-10"
                        />
                      </div>
                      <ScrollArea className="h-40 sm:h-48 border rounded-lg">
                        <div className="p-3 space-y-1">
                          {filteredUsers.map(user => (
                            <div key={user.user_id} className="flex items-center space-x-3 min-h-[44px] sm:min-h-[36px]">
                              <Checkbox
                                id={`user-${user.user_id}`}
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
                              <Label htmlFor={`user-${user.user_id}`} className="flex-1 cursor-pointer flex items-center gap-2 py-1">
                                <span className="text-sm">{user.username}</span>
                                <Badge variant="outline" className="text-xs">
                                  {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                                </Badge>
                              </Label>
                            </div>
                          ))}
                          {filteredUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Geen gebruikers gevonden
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      {formData.target_users.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {formData.target_users.length} gebruiker(s) geselecteerd
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="teams" className="mt-3">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Zoek team..."
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="pl-9 h-11 sm:h-10"
                        />
                      </div>
                      <ScrollArea className="h-40 sm:h-48 border rounded-lg">
                        <div className="p-3 space-y-1">
                          {filteredTeams.map(team => (
                            <div key={team.team_id} className="flex items-center space-x-3 min-h-[44px] sm:min-h-[36px]">
                              <Checkbox
                                id={`team-${team.team_id}`}
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
                              <Label htmlFor={`team-${team.team_id}`} className="cursor-pointer flex-1 text-sm py-1">
                                {team.team_name}
                              </Label>
                            </div>
                          ))}
                          {filteredTeams.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Geen teams gevonden
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      {formData.target_teams.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {formData.target_teams.length} team(s) geselecteerd
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Date Range - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Datum</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Eind Datum</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="h-11 sm:h-10"
                  />
                </div>
              </div>
              
              {/* Active Toggle */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50 min-h-[52px]">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label className="cursor-pointer">Actief</Label>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto h-11 sm:h-10"
                >
                  Annuleren
                </Button>
                <Button type="submit" className="btn btn--primary w-full sm:w-auto h-11 sm:h-10">
                  {editingNotification ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alle Notificaties</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen notificaties aangemaakt.
            </p>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {notifications.map((notification) => {
                  const target = getTargetDescription(notification);
                  return (
                    <Card key={notification.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2">
                            {notification.setting_value.message}
                          </p>
                          <Badge variant={getTypeBadgeVariant(notification.setting_value.type)} className="shrink-0">
                            {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {target.type === 'users' && <UserCheck className="w-3 h-3 text-muted-foreground" />}
                          {target.type === 'teams' && <Building2 className="w-3 h-3 text-muted-foreground" />}
                          {target.type === 'roles' && <Users className="w-3 h-3 text-muted-foreground" />}
                          {target.items.slice(0, 2).map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {target.items.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{target.items.length - 2}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notification.is_active}
                              onCheckedChange={() => toggleActive(notification)}
                              className="scale-75"
                            />
                            <span className="text-xs text-muted-foreground">
                              {notification.is_active ? 'Actief' : 'Inactief'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(notification)}
                              className="h-10 w-10 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="text-destructive h-10 w-10 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Bericht</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Doelgroep</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-center">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => {
                      const target = getTargetDescription(notification);
                      return (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {notification.setting_value.message}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeBadgeVariant(notification.setting_value.type)}>
                              {NOTIFICATION_TYPES.find(t => t.value === notification.setting_value.type)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {target.type === 'users' && <UserCheck className="w-4 h-4 text-muted-foreground" />}
                              {target.type === 'teams' && <Building2 className="w-4 h-4 text-muted-foreground" />}
                              {target.type === 'roles' && <Users className="w-4 h-4 text-muted-foreground" />}
                              {target.items.slice(0, 3).map((item, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                              {target.items.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{target.items.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={notification.is_active}
                                onCheckedChange={() => toggleActive(notification)}
                                className="scale-75"
                              />
                              <Badge variant={notification.is_active ? 'default' : 'secondary'} className="text-xs">
                                {notification.is_active ? 'Actief' : 'Inactief'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString('nl-NL')}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(notification)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPage;
