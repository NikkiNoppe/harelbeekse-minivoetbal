import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { 
  scheidsrechterService, 
  PollMatch
} from '@/services/scheidsrechter/scheidsrechterService';
import { RefereeDashboard } from '@/components/pages/public/scheidsrechters';

// Helper: Generate month options for dropdown
const getMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = -1; i <= 3; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: nl });
    months.push({ value, label });
  }
  return months;
};

// Main component
const ScheidsrechtersPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
    setIsLoadingRole(false);
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {isLoadingRole ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-2">
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <p className="text-sm text-muted-foreground mt-4">
                Gebruikersgegevens laden...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : userRole === 'admin' ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Scheidsrechter Schema</h1>
              <p className="text-muted-foreground mt-1">
                Beheer scheidsrechter toewijzingen per maand
              </p>
            </div>
          </div>
          <AdminView />
        </>
      ) : (
        // For referees and other roles - show the simplified read-only view
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Scheidsrechter Schema</h1>
              <p className="text-muted-foreground mt-1">
                Bekijk wedstrijdschema
              </p>
            </div>
          </div>
          <RefereeView />
        </>
      )}
    </div>
  );
};

// Admin view component
const AdminView = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [matches, setMatches] = useState<PollMatch[]>([]);
  const [allReferees, setAllReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for selected month
  const fetchMonthData = async () => {
    setLoading(true);
    try {
      // Fetch matches and referees in parallel
      const [monthMatches, referees] = await Promise.all([
        scheidsrechterService.getMonthMatches(selectedMonth),
        // Use referees_public view to prevent email exposure
        supabase.from('referees_public' as any).select('user_id, username')
      ]);

      setMatches(monthMatches);
      setAllReferees(referees.data || []);
    } catch (error) {
      console.error('Error fetching month data:', error);
      toast.error('Fout bij ophalen van gegevens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [selectedMonth]);

  // Handle referee assignment to a match
  const handleAssignReferee = async (matchId: number, refereeId: string) => {
    try {
      const success = await scheidsrechterService.assignRefereeToMatch(
        matchId,
        refereeId === 'none' ? null : parseInt(refereeId)
      );

      if (success) {
        toast.success(refereeId === 'none' ? 'Toewijzing verwijderd' : 'Scheidsrechter toegewezen');
        fetchMonthData();
      } else {
        toast.error('Fout bij toewijzen scheidsrechter');
      }
    } catch (error) {
      console.error('Error assigning referee:', error);
      toast.error('Fout bij toewijzen scheidsrechter');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Wedstrijden laden...</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tijd</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Wedstrijd</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheidsrechter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Database gegevens ophalen... Dit kan even duren.
            </p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Geen wedstrijden gevonden voor {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: nl })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {matches.length} {matches.length === 1 ? 'wedstrijd' : 'wedstrijden'} - {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: nl })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tijd</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Wedstrijd</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px]">Scheidsrechter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map(match => (
                  <TableRow key={match.match_id}>
                    <TableCell>
                      {format(new Date(match.match_date), 'EEE dd MMM', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(match.match_date), 'HH:mm')}
                    </TableCell>
                    <TableCell>{match.location}</TableCell>
                    <TableCell className="font-medium">
                      {match.home_team_name} vs {match.away_team_name}
                    </TableCell>
                    <TableCell>
                      {match.referee ? (
                        <Badge variant="default">🟢 Toegewezen</Badge>
                      ) : (
                        <Badge variant="secondary">🔵 Open</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={match.assigned_referee_id?.toString() || 'none'}
                        onValueChange={(val) => handleAssignReferee(match.match_id, val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Geen toewijzing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Geen toewijzing</SelectItem>
                          {allReferees.map(ref => (
                            <SelectItem key={ref.user_id} value={ref.user_id.toString()}>
                              {ref.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Referee view component
const RefereeView = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [matches, setMatches] = useState<PollMatch[]>([]);
  const [availability, setAvailability] = useState<Map<number, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const userId = parseInt(localStorage.getItem('userId') || '0');

  // Fetch referee data
  const fetchRefereeData = async () => {
    setLoading(true);
    try {
      // Fetch all matches for the month (no filter on referee)
      const allMatches = await scheidsrechterService.getMonthMatches(selectedMonth);
      setMatches(allMatches);
      
      // Load availability for all matches
      const matchIds = allMatches.map(m => m.match_id);
      const availabilityMap = await scheidsrechterService.getRefereeMatchAvailability(userId, matchIds);
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching referee data:', error);
      toast.error('Fout bij ophalen van gegevens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefereeData();
  }, [selectedMonth]);

  const handleAvailabilityChange = async (matchId: number, isAvailable: boolean) => {
    try {
      await scheidsrechterService.updateMatchAvailability(userId, matchId, isAvailable, selectedMonth);
      setAvailability(prev => new Map(prev).set(matchId, isAvailable));
      toast.success('Beschikbaarheid bijgewerkt');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Kon beschikbaarheid niet opslaan');
    }
  };

  // Group matches by week, then by date and location (poll groups)
  const groupedByWeek = matches.reduce((weekAcc, match) => {
    const date = new Date(match.match_date);
    const weekKey = `Week ${format(date, 'w', { locale: nl })} - ${format(date, 'yyyy', { locale: nl })}`;
    
    if (!weekAcc[weekKey]) weekAcc[weekKey] = {};
    
    const dateKey = format(date, 'EEEE d MMMM', { locale: nl });
    const location = match.location || 'Onbekend';
    const pollKey = `${dateKey} - ${location}`;
    
    if (!weekAcc[weekKey][pollKey]) {
      weekAcc[weekKey][pollKey] = {
        date: dateKey,
        location: location,
        matches: []
      };
    }
    
    weekAcc[weekKey][pollKey].matches.push(match);
    
    return weekAcc;
  }, {} as Record<string, Record<string, { date: string; location: string; matches: PollMatch[] }>>);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Beschikbaarheid Invullen</CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Wedstrijden laden...</p>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Geen wedstrijden voor {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: nl })}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByWeek).map(([weekKey, pollGroups]) => (
              <div key={weekKey} className="space-y-4">
                <h2 className="text-base font-semibold border-b pb-2 text-primary">
                  📆 {weekKey}
                </h2>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-28 text-xs">Datum & Locatie</TableHead>
                        <TableHead className="w-16 text-xs">Tijd</TableHead>
                        <TableHead className="text-xs">Wedstrijd</TableHead>
                        <TableHead className="w-36 text-xs">Scheidsrechter</TableHead>
                        <TableHead className="w-20 text-xs text-center">Beschikbaar?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(pollGroups).map(([pollKey, pollData]) => {
                        const firstMatch = pollData.matches[0];
                        const allMatchIds = pollData.matches.map(m => m.match_id);
                        const anyAssignedToMe = pollData.matches.some(m => m.assigned_referee_id === userId);
                        const allAvailable = allMatchIds.every(id => availability.get(id));
                        
                        // Get unique referee for this poll group
                        const pollReferee = pollData.matches.find(m => m.referee)?.referee || null;
                        
                        return (
                          <React.Fragment key={pollKey}>
                            {pollData.matches.map((match, idx) => {
                              const date = new Date(match.match_date);
                              
                              return (
                                <TableRow key={match.match_id} className="text-sm">
                                  {idx === 0 && (
                                    <TableCell 
                                      rowSpan={pollData.matches.length} 
                                      className="font-medium text-xs bg-muted/30 align-middle px-2"
                                    >
                                      <div className="flex items-center gap-1 text-[11px]">
                                        📅 {pollData.date.split(' ').slice(0, 2).join(' ')}
                                      </div>
                                      <div className="text-muted-foreground text-[11px]">
                                        📍 {pollData.location}
                                      </div>
                                    </TableCell>
                                  )}
                                  <TableCell className="font-medium text-xs px-2">
                                    {format(date, 'HH:mm')}
                                  </TableCell>
                                  <TableCell className="text-xs px-2">
                                    <span className="truncate block">{match.home_team_name} vs {match.away_team_name}</span>
                                  </TableCell>
                                  {idx === 0 && (
                                    <TableCell 
                                      rowSpan={pollData.matches.length} 
                                      className="text-xs bg-muted/30 align-middle px-2"
                                    >
                                      {pollReferee ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                          ✅ {pollReferee}
                                        </span>
                                      ) : (
                                        <span className="text-blue-600 flex items-center gap-1">
                                          🔵 Open
                                        </span>
                                      )}
                                    </TableCell>
                                  )}
                                  {idx === 0 && (
                                    <TableCell 
                                      rowSpan={pollData.matches.length} 
                                      className="text-center bg-muted/30 align-middle px-2"
                                    >
                                      <Checkbox
                                        checked={allAvailable}
                                        disabled={anyAssignedToMe}
                                        onCheckedChange={(checked) => {
                                          allMatchIds.forEach(matchId => 
                                            handleAvailabilityChange(matchId, checked === true)
                                          );
                                        }}
                                      />
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheidsrechtersPage;
