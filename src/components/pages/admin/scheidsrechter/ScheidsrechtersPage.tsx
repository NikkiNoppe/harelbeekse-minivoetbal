import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { 
  scheidsrechterService, 
  PollMatch
} from '@/services/scheidsrechter/scheidsrechterService';

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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
  }, []);

  if (!userRole) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Laden...
          </CardContent>
        </Card>
      </div>
    );
  }

  return userRole === 'admin' ? <AdminView /> : <RefereeView />;
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
        supabase.from('users').select('user_id, username').eq('role', 'referee')
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheidsrechter Schema</h1>
          <p className="text-muted-foreground mt-1">
            Beheer scheidsrechter toewijzingen per maand
          </p>
        </div>
        
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
          <CardContent className="p-8 text-center text-muted-foreground">
            Gegevens laden...
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
  const [loading, setLoading] = useState(true);

  // Fetch referee data
  const fetchRefereeData = async () => {
    setLoading(true);
    try {
      // Fetch all matches for the month
      const allMatches = await scheidsrechterService.getMonthMatches(selectedMonth);
      
      // Filter to only show open matches (no referee assigned)
      const openMatches = allMatches.filter(m => !m.referee);
      setMatches(openMatches);
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

  const openMatchesCount = matches.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Open Wedstrijden</h1>
          <p className="text-muted-foreground mt-1">
            {openMatchesCount} {openMatchesCount === 1 ? 'open wedstrijd' : 'open wedstrijden'} voor {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: nl })}
          </p>
        </div>
        
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
          <CardContent className="p-8 text-center text-muted-foreground">
            Gegevens laden...
          </CardContent>
        </Card>
      ) : openMatchesCount === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Alle wedstrijden zijn toegewezen voor {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: nl })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Wedstrijden zonder scheidsrechter</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tijd</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Wedstrijd</TableHead>
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

export default ScheidsrechtersPage;
