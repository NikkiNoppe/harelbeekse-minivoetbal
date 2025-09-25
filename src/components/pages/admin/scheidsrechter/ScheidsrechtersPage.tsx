import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/pages/login/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { scheidsrechterService, PollGroup, RefereeAvailability, ActiveRange } from '@/services/scheidsrechter/scheidsrechterService';
import { CalendarDays, MapPin, Clock, Users, UserCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ScheidsrechtersPage: React.FC = () => {
  const { user } = useAuth();
  
  // Show loading or login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Scheidsrechters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Je moet ingelogd zijn om deze pagina te bekijken.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const isAdmin = user.role === 'admin';
  return isAdmin ? <AdminView /> : <RefereeView userId={user.id || 0} username={user.username || ''} />;
};

const AdminView: React.FC = () => {
  const { toast } = useToast();
  const [isSystemEnabled, setIsSystemEnabled] = useState(false);
  const nowA = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${nowA.getFullYear()}-${String(nowA.getMonth() + 1).padStart(2, '0')}`);
  const [pollGroups, setPollGroups] = useState<PollGroup[]>([]);
  const [refereeAvailability, setRefereeAvailability] = useState<RefereeAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed manual active range controls; filtering is automatic by selected month
  const [generating, setGenerating] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState('Gelieve de maandelijkse poll in te vullen.');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const getMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value, label: date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' }) });
    }
    return options;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [enabled, groups, availability] = await Promise.all([
        scheidsrechterService.isPollSystemEnabled(),
        scheidsrechterService.getMonthlyPollData(selectedMonth),
        scheidsrechterService.getRefereeAvailability(selectedMonth),
      ]);
      setIsSystemEnabled(enabled);
      setPollGroups(groups);
      setRefereeAvailability(availability);
    } catch (e) {
      toast({ title: 'Error', description: 'Kon poll data niet laden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedMonth]);

  const handleToggleSystem = async (enabled: boolean) => {
    const success = await scheidsrechterService.togglePollSystem(enabled);
    if (success) {
      setIsSystemEnabled(enabled);
      toast({ title: 'Systeem bijgewerkt', description: `Poll systeem is ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}` });
    } else {
      toast({ title: 'Error', description: 'Kon systeem status niet bijwerken', variant: 'destructive' });
    }
  };

  const handleAssignReferee = async (pollGroupId: string, refereeId: number) => {
    const success = await scheidsrechterService.assignRefereeToGroup(pollGroupId, refereeId);
    if (success) {
      toast({ title: 'Scheidsrechter toegewezen', description: 'Scheidsrechter is succesvol toegewezen aan de wedstrijdgroep' });
      loadData();
    } else {
      toast({ title: 'Error', description: 'Kon scheidsrechter niet toewijzen', variant: 'destructive' });
    }
  };

  const getAvailableReferees = (pollGroupId: string) => refereeAvailability.filter(ref => ref.availability[pollGroupId] === true);

  // Manual active range saving removed

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await scheidsrechterService.generateMonthlyPolls(selectedMonth);
    setGenerating(false);
    if (result.success) { toast({ title: 'Poll groepen gegenereerd', description: result.message || 'Nieuwe groepen aangemaakt.' }); loadData(); }
    else { toast({ title: 'Error', description: 'Kon poll groepen niet genereren', variant: 'destructive' }); }
  };

  const handleSendAnnouncement = async () => {
    setSendingAnnouncement(true);
    const ok = await scheidsrechterService.sendNotification('poll_announcement', announceMessage, ['referee', 'admin']);
    setSendingAnnouncement(false);
    if (ok) { toast({ title: 'Aankondiging verzonden', description: 'Bericht is verzonden naar doelgroepen.' }); setAnnounceOpen(false); }
    else { toast({ title: 'Error', description: 'Kon aankondiging niet verzenden', variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-lg">Laden...</div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scheidsrechter Schema</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {getMonthOptions().map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={generating}>{generating ? 'Genereert...' : 'Genereer poll groepen'}</Button>
        <Button variant="outline" onClick={() => setAnnounceOpen(true)}>Aankondiging plaatsen</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Admin - Scheidsrechter Toewijzing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Selecteer een scheidsrechter voor elke wedstrijdgroep. Wijzigingen worden automatisch opgeslagen.
          </p>
        </CardContent>
      </Card>

      {/* Actieve periode handmatige instellingen verwijderd; filtering gebeurt automatisch per geselecteerde maand */}

      <Card>
        <CardHeader><CardTitle>Bevestigd schema</CardTitle></CardHeader>
        <CardContent>
          {pollGroups.filter(g => g.status === 'confirmed').length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen bevestigde wedstrijden.</p>
          ) : (
            <div className="grid gap-3">
              {pollGroups.filter(g => g.status === 'confirmed').map(group => (
                <div key={group.poll_group_id} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />{group.location}<Clock className="w-4 h-4 ml-2" />{group.time_slot}</div>
                    <Badge variant="default">Bevestigd</Badge>
                  </div>
                  <div className="grid gap-1">
                    {group.matches.map(m => {
                      const raw = m.match_date as string;
                      const sep = raw.includes('T') ? 'T' : ' ';
                      const datePart = (raw.split(sep)[0] || '').slice(0, 10);
                      return (
                        <div key={m.match_id} className="text-sm flex items-center justify-between"><span>{m.home_team_name} vs {m.away_team_name}</span><span className="text-muted-foreground">{datePart}</span></div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {pollGroups.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Geen poll groepen gevonden voor {selectedMonth}</p></CardContent></Card>
      ) : (
        <div className="space-y-8">
          {(() => {
            // Group by week
            const weekGroups = new Map<string, PollGroup[]>();
            pollGroups.forEach(group => {
              const firstMatch = group.matches[0];
              if (firstMatch) {
                const raw = firstMatch.match_date as string;
                const sep = raw.includes('T') ? 'T' : ' ';
                const datePart = (raw.split(sep)[0] || '').slice(0, 10);
                const date = new Date(datePart);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
                const weekKey = weekStart.toISOString().slice(0, 10);
                if (!weekGroups.has(weekKey)) weekGroups.set(weekKey, []);
                weekGroups.get(weekKey)!.push(group);
              }
            });

            return Array.from(weekGroups.entries()).map(([weekStart, groups]) => {
              // Get actual match dates from groups
              const matchDates = groups.flatMap(group => 
                group.matches.map(match => {
                  const raw = match.match_date as string;
                  const sep = raw.includes('T') ? 'T' : ' ';
                  return (raw.split(sep)[0] || '').slice(0, 10);
                })
              ).filter(Boolean);
              
              // Sort dates and get first and last
              const sortedDates = [...new Set(matchDates)].sort();
              const firstDate = sortedDates[0];
              const lastDate = sortedDates[sortedDates.length - 1];
              
              const weekLabel = firstDate === lastDate 
                ? `Week van ${new Date(firstDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
                : `Week van ${new Date(firstDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - ${new Date(lastDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`;
              
              return (
                <Card key={weekStart} className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      {weekLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid md:grid-cols-10 gap-2 px-3 py-2 bg-gray-50 border-b font-semibold text-xs text-gray-600">
                      <div className="col-span-2">Dag</div>
                      <div className="col-span-2">Locatie</div>
                      <div className="col-span-2">Tijd</div>
                      <div className="col-span-2">Wedstrijden</div>
                      <div className="col-span-2">Scheidsrechter</div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {groups.map((group, index) => {
                        const availableReferees = getAvailableReferees(group.poll_group_id);
                        const assignedReferee = group.matches[0]?.assigned_referee_name;
                        const firstMatch = group.matches[0];
                        const raw = firstMatch?.match_date as string;
                        const sep = raw?.includes('T') ? 'T' : ' ';
                        const datePart = (raw?.split(sep)[0] || '').slice(0, 10);
                        const dayName = new Date(datePart).toLocaleDateString('nl-NL', { weekday: 'long' });
                        const dayShort = new Date(datePart).toLocaleDateString('nl-NL', { weekday: 'short' });
                        
                        return (
                          <div key={group.poll_group_id} className={`p-2 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            {/* Desktop Grid Layout */}
                            <div className="hidden md:grid md:grid-cols-10 gap-2 items-center">
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700">{dayShort}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {datePart.split('-').reverse().join('-')}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="col-span-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="font-medium text-gray-700 text-xs truncate">{group.location}</span>
                                </div>
                              </div>
                              
                              <div className="col-span-2">
                                <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{group.time_slot}</span>
                              </div>
                              
                              <div className="col-span-2">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">{group.match_count} wedstrijd{group.match_count !== 1 ? 'en' : ''}</span>
                                </div>
                              </div>
                              
                              <div className="col-span-2">
                                <Select 
                                  value={assignedReferee ? assignedReferee : 'none'} 
                                  onValueChange={(value) => {
                                    if (value === 'none') {
                                      // Remove assignment
                                      scheidsrechterService.assignRefereeToGroup(group.poll_group_id, 0);
                                    } else {
                                      // Assign referee
                                      const referee = refereeAvailability.find(r => r.username === value);
                                      if (referee) {
                                        scheidsrechterService.assignRefereeToGroup(group.poll_group_id, referee.user_id);
                                      }
                                    }
                                    loadData();
                                  }}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue placeholder="Selecteer scheidsrechter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Geen toewijzing</SelectItem>
                                    {availableReferees.map(ref => (
                                      <SelectItem key={ref.user_id} value={ref.username}>
                                        {ref.username}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            {/* Mobile Card Layout */}
                            <div className="md:hidden space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-700">{dayShort}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {datePart.split('-').reverse().join('-')}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="font-medium text-gray-700 truncate">{group.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{group.time_slot}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600">{group.match_count} wedstrijd{group.match_count !== 1 ? 'en' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Select 
                                    value={assignedReferee ? assignedReferee : 'none'} 
                                    onValueChange={(value) => {
                                      if (value === 'none') {
                                        // Remove assignment
                                        scheidsrechterService.assignRefereeToGroup(group.poll_group_id, 0);
                                      } else {
                                        // Assign referee
                                        const referee = refereeAvailability.find(r => r.username === value);
                                        if (referee) {
                                          scheidsrechterService.assignRefereeToGroup(group.poll_group_id, referee.user_id);
                                        }
                                      }
                                      loadData();
                                    }}
                                  >
                                    <SelectTrigger className="h-6 text-xs">
                                      <SelectValue placeholder="Selecteer scheidsrechter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Geen toewijzing</SelectItem>
                                      {availableReferees.map(ref => (
                                        <SelectItem key={ref.user_id} value={ref.username}>
                                          {ref.username}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
        </div>
      )}

      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="modal">
          <DialogHeader><DialogTitle>Aankondiging plaatsen</DialogTitle><DialogDescription>Plaats een korte boodschap voor scheidsrechters en admins.</DialogDescription></DialogHeader>
          <div className="space-y-3"><Textarea value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} rows={4} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAnnounceOpen(false)}>Annuleren</Button><Button onClick={handleSendAnnouncement} disabled={sendingAnnouncement}>{sendingAnnouncement ? 'Versturen...' : 'Verstuur'}</Button></div></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const RefereeView: React.FC<{ userId: number; username: string }> = ({ userId, username }) => {
  const { toast } = useToast();
  const nowB = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${nowB.getFullYear()}-${String(nowB.getMonth() + 1).padStart(2, '0')}`);
  const [pollGroups, setPollGroups] = useState<PollGroup[]>([]);
  const [myAvailability, setMyAvailability] = useState<Record<string, boolean>>({});
  const [activeRange, setActiveRange] = useState<ActiveRange | null>(null);
  const [announcements, setAnnouncements] = useState<{ message: string; created_at?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const getMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value, label: date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' }) });
    }
    return options;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [groups, availability, range, notes] = await Promise.all([
        scheidsrechterService.getMonthlyPollData(selectedMonth),
        scheidsrechterService.getRefereeAvailability(selectedMonth),
        scheidsrechterService.getActiveRange(selectedMonth),
        scheidsrechterService.getAnnouncements(5),
      ]);
      let filtered = groups;
      if (range && range.enabled && (range.start_date || range.end_date)) {
        filtered = groups.filter(g => {
          const firstMatch = g.matches[0];
          if (!firstMatch) return false;
          const d = new Date(firstMatch.match_date).toISOString().slice(0, 10);
          if (range.start_date && d < range.start_date) return false;
          if (range.end_date && d > range.end_date) return false;
          return true;
        });
      }
      setPollGroups(filtered);
      setActiveRange(range);
      setAnnouncements(notes);
      const myAvail = availability.find(ref => ref.user_id === userId);
      setMyAvailability(myAvail?.availability || {});
    } catch (e) {
      toast({ title: 'Error', description: 'Kon poll data niet laden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedMonth, userId]);

  const handleAvailabilityChange = async (pollGroupId: string, isAvailable: boolean) => {
    setSaving(pollGroupId);
    try {
      const success = await scheidsrechterService.updateRefereeAvailability(userId, pollGroupId, selectedMonth, isAvailable);
      if (success) { setMyAvailability(prev => ({ ...prev, [pollGroupId]: isAvailable })); }
      else { toast({ title: 'Error', description: 'Kon beschikbaarheid niet bijwerken', variant: 'destructive' }); }
    } catch {
      toast({ title: 'Error', description: 'Er ging iets mis bij het bijwerken van je beschikbaarheid', variant: 'destructive' });
    } finally { setSaving(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-lg">Laden...</div></div>;

  // Speeldata overzicht per maand
  const byDay: Record<string, { location: string; time: string }[]> = {};
  pollGroups.forEach(g => {
    const day = new Date(g.matches[0]?.match_date || '').toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({ location: g.location, time: g.time_slot });
  });
  const days = Object.keys(byDay).sort();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Mijn Beschikbaarheid</h1><div className="text-sm text-muted-foreground">Ingelogd als: {username}</div></div>
      <div className="flex items-center space-x-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{getMonthOptions().map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">{announcements.slice(0, 1).map((a, idx) => (<span key={idx}>📢 {a.message}</span>))}</div>
      </div>

      <Card><CardHeader><CardTitle>Speeldata voor {selectedMonth}</CardTitle></CardHeader><CardContent>{days.length === 0 ? (<p className="text-sm text-muted-foreground">Geen speelmomenten gevonden.</p>) : (<div className="space-y-3">{days.map(d => (<div key={d} className="border rounded p-3"><div className="font-medium mb-2">{new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="grid md:grid-cols-2 gap-2">{byDay[d].map((it, idx) => (<div key={idx} className="text-sm flex items-center justify-between"><span>{it.location}</span><span className="text-muted-foreground">{it.time}</span></div>))}</div></div>))}</div>)}</CardContent></Card>

      {pollGroups.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Geen polls beschikbaar voor {selectedMonth}</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {pollGroups.map(group => {
            const isAvailable = myAvailability[group.poll_group_id] || false;
            const isAssignedToMe = group.matches.some(match => match.assigned_referee_id === userId);
            const isSaving = saving === group.poll_group_id;
            return (
              <Card key={group.poll_group_id} className="w-full">
                <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-4 h-4" />{group.location}<Clock className="w-4 h-4 ml-2" />{group.time_slot}</CardTitle><Badge variant={isAssignedToMe ? 'default' : group.status === 'confirmed' ? 'outline' : 'secondary'}>{isAssignedToMe ? 'Toegewezen aan jou' : group.status === 'confirmed' ? 'Toegewezen aan ander' : 'Open voor poll'}</Badge></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2"><h4 className="font-medium">Wedstrijden:</h4>{group.matches.map(match => (<div key={match.match_id} className="text-sm p-2 bg-muted rounded"><div className="font-medium">{match.home_team_name} vs {match.away_team_name}</div><div className="text-muted-foreground">{new Date(match.match_date).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div>))}</div>
                  <div className="flex items-center justify-between p-3 border rounded"><span className="font-medium">Ben je beschikbaar voor deze wedstrijdgroep?</span><Switch checked={isAvailable} onCheckedChange={(checked) => handleAvailabilityChange(group.poll_group_id, checked)} disabled={isSaving || isAssignedToMe} /></div>
                  {isAssignedToMe && (<div className="p-3 bg-green-50 border border-green-200 rounded"><p className="text-green-800 font-medium">🎉 Je bent toegewezen aan deze wedstrijdgroep!</p><p className="text-green-700 text-sm mt-1">Zorg ervoor dat je op tijd aanwezig bent voor alle wedstrijden.</p></div>)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScheidsrechtersPage;

