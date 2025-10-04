import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/pages/login/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, CheckCircle2, Clock, AlertCircle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { scheidsrechterService, type PollGroup, type RefereeAvailability, type PollMatch } from '@/services/scheidsrechter/scheidsrechterService';
import { refereeService, type Referee } from '@/services/core/refereeService';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// Helper: Generate month options (September 2025 to +3 months from now)
const getMonthOptions = () => {
  const options = [];
  const startDate = new Date(2025, 8, 1); // September 2025
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  
  let current = startDate;
  while (current <= endDate) {
    options.push({
      value: format(current, 'yyyy-MM'),
      label: format(current, 'MMMM yyyy', { locale: nl })
    });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  
  return options;
};

// Helper: Get status badge for poll group
const getGroupStatus = (group: PollGroup): { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string } => {
  // Check both assigned_referee_id AND referee text field
  const allAssigned = group.matches.every(m => m.assigned_referee_id || m.referee);
  const someAssigned = group.matches.some(m => m.assigned_referee_id || m.referee);
  
  if (allAssigned) return { variant: 'default', label: '🟢 Bevestigd' };
  if (someAssigned) return { variant: 'outline', label: '🟡 Gedeeltelijk' };
  return { variant: 'secondary', label: '🔵 Open voor poll' };
};

const ScheidsrechtersPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Scheidsrechters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Je moet ingelogd zijn om deze pagina te bekijken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isAdmin = user.role === 'admin';
  return isAdmin ? <AdminView /> : <RefereeView />;
};

// ============== ADMIN VIEW ==============
const AdminView: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [pollGroups, setPollGroups] = useState<PollGroup[]>([]);
  const [legacyMatches, setLegacyMatches] = useState<PollMatch[]>([]);
  const [availability, setAvailability] = useState<RefereeAvailability[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAutoGrouping, setIsAutoGrouping] = useState(false);
  const [editingLegacyMatch, setEditingLegacyMatch] = useState<number | null>(null);
  const [legacyRefereeText, setLegacyRefereeText] = useState<string>('');

  // Fetch data for selected month with auto-grouping
  const fetchMonthData = async () => {
    setLoading(true);
    try {
      // Check if auto-grouping is needed
      const needsGrouping = await scheidsrechterService.needsAutoGrouping(selectedMonth);
      
      if (needsGrouping) {
        setIsAutoGrouping(true);
        const success = await scheidsrechterService.autoGenerateIfNeeded(selectedMonth);
        setIsAutoGrouping(false);
        
        if (!success) {
          toast.error('Fout bij automatisch groeperen');
        }
      }

      const [groupsData, availData, refereesData, legacyData] = await Promise.all([
        scheidsrechterService.getMonthlyPollData(selectedMonth),
        scheidsrechterService.getRefereeAvailability(selectedMonth),
        refereeService.getReferees(),
        scheidsrechterService.getLegacyMatches(selectedMonth)
      ]);
      
      setPollGroups(groupsData);
      setAvailability(availData);
      setReferees(refereesData);
      setLegacyMatches(legacyData);
    } catch (error) {
      console.error('Error fetching month data:', error);
      toast.error('Fout bij laden van data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [selectedMonth]);

  // Update legacy referee text
  const handleUpdateLegacyReferee = async (matchId: number) => {
    try {
      const success = await scheidsrechterService.updateLegacyReferee(matchId, legacyRefereeText);
      if (success) {
        toast.success('Scheidsrechter bijgewerkt');
        setEditingLegacyMatch(null);
        setLegacyRefereeText('');
        await fetchMonthData();
      } else {
        toast.error('Fout bij opslaan');
      }
    } catch (error) {
      console.error('Error updating legacy referee:', error);
      toast.error('Fout bij opslaan');
    }
  };

  // Assign referee to poll group (admin can always change)
  const handleAssignReferee = async (pollGroupId: string, refereeId: string) => {
    try {
      if (refereeId === 'none') {
        // Clear assignment - update all matches in group
        const group = pollGroups.find(g => g.poll_group_id === pollGroupId);
        if (!group) return;

        for (const match of group.matches) {
          await supabase
            .from('matches')
            .update({ assigned_referee_id: null, referee: null })
            .eq('match_id', match.match_id);
        }
        toast.success('Toewijzing verwijderd');
      } else {
        const success = await scheidsrechterService.assignRefereeToGroup(pollGroupId, parseInt(refereeId));
        if (success) {
          toast.success('Scheidsrechter toegewezen');
        } else {
          toast.error('Fout bij toewijzen');
        }
      }
      await fetchMonthData();
    } catch (error) {
      console.error('Error assigning referee:', error);
      toast.error('Fout bij toewijzen scheidsrechter');
    }
  };

  // Get available referees for a poll group (admin sees all referees)
  const getAvailableReferees = (pollGroupId: string): Referee[] => {
    return referees; // Admin can assign any referee
  };

  // Group poll groups by week
  const groupByWeek = (groups: PollGroup[]) => {
    const weeks: { [key: string]: PollGroup[] } = {};
    
    groups.forEach(group => {
      if (group.matches.length === 0) return;
      
      const firstMatch = group.matches[0];
      const date = parseISO(firstMatch.match_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(group);
    });
    
    return weeks;
  };

  const weeklyGroups = groupByWeek(pollGroups);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheidsrechter Schema - Admin</h1>
          <p className="text-muted-foreground">Beheer poll groepen en wijs scheidsrechters toe</p>
        </div>
      </div>

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Maand Selectie</CardTitle>
          <CardDescription>Selecteer een maand om de wedstrijden en polls te bekijken</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Auto-grouping indicator */}
      {isAutoGrouping && (
        <Card className="border-blue-500">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <p className="text-sm">Automatisch poll groepen aan het genereren...</p>
          </CardContent>
        </Card>
      )}

      {/* Legacy Matches Section */}
      {legacyMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Handmatig Toegewezen Wedstrijden
            </CardTitle>
            <CardDescription>
              Deze wedstrijden werden handmatig toegewezen en maken geen deel uit van het poll systeem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {legacyMatches.map(match => (
              <div key={match.match_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Legacy - Handmatig</Badge>
                    <span className="text-sm font-medium">
                      {format(parseISO(match.match_date), 'dd MMM yyyy HH:mm', { locale: nl })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {match.location}
                  </div>
                  <div className="text-sm">
                    {match.home_team_name} vs {match.away_team_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingLegacyMatch === match.match_id ? (
                    <>
                      <Input
                        value={legacyRefereeText}
                        onChange={(e) => setLegacyRefereeText(e.target.value)}
                        placeholder="Scheidsrechter naam"
                        className="w-48"
                      />
                      <Button size="sm" onClick={() => handleUpdateLegacyReferee(match.match_id)}>
                        Opslaan
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setEditingLegacyMatch(null);
                          setLegacyRefereeText('');
                        }}
                      >
                        Annuleer
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{match.referee || 'Geen scheidsrechter'}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingLegacyMatch(match.match_id);
                          setLegacyRefereeText(match.referee || '');
                        }}
                      >
                        Wijzig
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Poll Groups - Week Grouped */}
      <Card>
        <CardHeader>
          <CardTitle>Poll Groepen</CardTitle>
          <CardDescription>
            Wijs scheidsrechters toe aan poll groepen - Je kan altijd wijzigen, ook na bevestiging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Laden...</p>
            </div>
          ) : Object.keys(weeklyGroups).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Geen poll groepen voor deze maand
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(weeklyGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([weekKey, groups]) => {
                  const weekDate = parseISO(weekKey);
                  return (
                    <div key={weekKey} className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        Week van {format(weekDate, 'dd MMMM yyyy', { locale: nl })}
                      </h3>
                      {groups.map(group => {
                        const availableRefs = getAvailableReferees(group.poll_group_id);
                        const firstMatch = group.matches[0];
                        const assignedRef = group.matches[0]?.assigned_referee_id;
                        const status = getGroupStatus(group);
                        
                        return (
                          <div key={group.poll_group_id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(parseISO(firstMatch.match_date), 'EEEE dd MMMM', { locale: nl })}
                                  </span>
                                  <Badge variant="outline">{format(parseISO(firstMatch.match_date), 'HH:mm')}</Badge>
                                  <Badge variant={status.variant as any}>{status.label}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <MapPin className="h-4 w-4" />
                                  {firstMatch.location}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>{group.matches.length} wedstrijden</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                          <Select
                            value={assignedRef?.toString() || 'none'}
                            onValueChange={(value) => handleAssignReferee(group.poll_group_id, value)}
                          >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Kies scheidsrechter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Geen toewijzing</SelectItem>
                                    {availableRefs.map(ref => (
                                      <SelectItem key={ref.user_id} value={ref.user_id.toString()}>
                                        {ref.username}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============== REFEREE VIEW ==============
const RefereeView: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [pollGroups, setPollGroups] = useState<PollGroup[]>([]);
  const [myAvailability, setMyAvailability] = useState<RefereeAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRefereeData = async () => {
    setLoading(true);
    try {
      const [groupsData, availData] = await Promise.all([
        scheidsrechterService.getMonthlyPollData(selectedMonth),
        scheidsrechterService.getRefereeAvailability(selectedMonth)
      ]);
      
      setPollGroups(groupsData);
      setMyAvailability(availData);
    } catch (error) {
      console.error('Error fetching referee data:', error);
      toast.error('Fout bij laden van data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefereeData();
  }, [selectedMonth]);

  const handleToggleAvailability = async (pollGroupId: string, isAvailable: boolean) => {
    if (!user || !user.id) return;

    // Check if poll is confirmed
    const group = pollGroups.find(g => g.poll_group_id === pollGroupId);
    const isConfirmed = group?.matches.every(m => m.assigned_referee_id || m.referee);

    if (isConfirmed) {
      toast.error('Deze poll is bevestigd en kan niet meer gewijzigd worden');
      return;
    }

    try {
      const success = await scheidsrechterService.updateRefereeAvailability(
        user.id,
        pollGroupId,
        selectedMonth,
        isAvailable
      );

      if (success) {
        toast.success(isAvailable ? 'Beschikbaarheid aangegeven' : 'Beschikbaarheid ingetrokken');
        await fetchRefereeData();
      } else {
        toast.error('Fout bij opslaan');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Fout bij opslaan beschikbaarheid');
    }
  };

  const groupByWeek = (groups: PollGroup[]) => {
    const weeks: { [key: string]: PollGroup[] } = {};
    
    groups.forEach(group => {
      if (group.matches.length === 0) return;
      
      const firstMatch = group.matches[0];
      const date = parseISO(firstMatch.match_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(group);
    });
    
    return weeks;
  };

  const weeklyGroups = groupByWeek(pollGroups);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheidsrechter Schema</h1>
        <p className="text-muted-foreground">Geef je beschikbaarheid aan voor wedstrijdgroepen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maand Selectie</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Poll Groepen</CardTitle>
          <CardDescription>Geef aan wanneer je beschikbaar bent</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Laden...</p>
            </div>
          ) : Object.keys(weeklyGroups).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Geen poll groepen voor deze maand</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(weeklyGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([weekKey, groups]) => {
                  const weekDate = parseISO(weekKey);
                  return (
                    <div key={weekKey} className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        Week van {format(weekDate, 'dd MMMM yyyy', { locale: nl })}
                      </h3>
                      {groups.map(group => {
                        const firstMatch = group.matches[0];
                        const myAvail = myAvailability.find(a => a.user_id === user?.id);
                        const isAvailable = myAvail?.availability[group.poll_group_id] === true;
                        const isAssigned = group.matches.some(m => m.assigned_referee_id === user?.id);
                        const isConfirmed = group.matches.every(m => m.assigned_referee_id);
                        
                        return (
                          <div key={group.poll_group_id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(parseISO(firstMatch.match_date), 'EEEE dd MMMM', { locale: nl })}
                                  </span>
                                  <Badge variant="outline">{format(parseISO(firstMatch.match_date), 'HH:mm')}</Badge>
                                  {isConfirmed && <Badge variant="default">🟢 Bevestigd</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {firstMatch.location}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {isAssigned ? (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Jij bent toegewezen
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`poll-${group.poll_group_id}`}
                                      checked={isAvailable}
                                      disabled={isConfirmed}
                                      onCheckedChange={(checked) => 
                                        handleToggleAvailability(group.poll_group_id, checked === true)
                                      }
                                    />
                                    <label 
                                      htmlFor={`poll-${group.poll_group_id}`}
                                      className={`text-sm ${isConfirmed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                      title={isConfirmed ? 'Deze poll is bevestigd en kan niet meer gewijzigd worden' : ''}
                                    >
                                      Ik ben beschikbaar
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheidsrechtersPage;