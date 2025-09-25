import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { pollService, PollGroup, RefereeAvailability } from '@/services/poll/pollService';
import { CalendarDays, MapPin, Clock, Users, UserCheck } from 'lucide-react';

const AdminPollPage: React.FC = () => {
  const [isSystemEnabled, setIsSystemEnabled] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [pollGroups, setPollGroups] = useState<PollGroup[]>([]);
  const [refereeAvailability, setRefereeAvailability] = useState<RefereeAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Generate month options (current + next 3 months)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [enabled, groups, availability] = await Promise.all([
        pollService.isPollSystemEnabled(),
        pollService.getMonthlyPollData(selectedMonth),
        pollService.getRefereeAvailability(selectedMonth)
      ]);

      setIsSystemEnabled(enabled);
      setPollGroups(groups);
      setRefereeAvailability(availability);
    } catch (error) {
      console.error('Error loading poll data:', error);
      toast({
        title: "Error",
        description: "Kon poll data niet laden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const handleToggleSystem = async (enabled: boolean) => {
    const success = await pollService.togglePollSystem(enabled);
    if (success) {
      setIsSystemEnabled(enabled);
      toast({
        title: "Systeem bijgewerkt",
        description: `Poll systeem is ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Kon systeem status niet bijwerken",
        variant: "destructive"
      });
    }
  };

  const handleAssignReferee = async (pollGroupId: string, refereeId: number) => {
    const success = await pollService.assignRefereeToGroup(pollGroupId, refereeId);
    if (success) {
      toast({
        title: "Scheidsrechter toegewezen",
        description: "Scheidsrechter is succesvol toegewezen aan de wedstrijdgroep",
      });
      loadData(); // Refresh data
    } else {
      toast({
        title: "Error",
        description: "Kon scheidsrechter niet toewijzen",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary">Open</Badge>;
      case 'closed':
        return <Badge variant="outline">Gesloten</Badge>;
      case 'confirmed':
        return <Badge variant="default">Bevestigd</Badge>;
      default:
        return <Badge variant="secondary">Onbekend</Badge>;
    }
  };

  const getAvailableReferees = (pollGroupId: string) => {
    return refereeAvailability.filter(ref => 
      ref.availability[pollGroupId] === true
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scheidsrechter Polls</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <span>Systeem actief:</span>
            <Switch
              checked={isSystemEnabled}
              onCheckedChange={handleToggleSystem}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-4">
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
        <Button onClick={loadData} variant="outline">
          Vernieuw
        </Button>
      </div>

      {!isSystemEnabled && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-orange-800">
              Het poll systeem is uitgeschakeld. Schakel het in om polls te beheren.
            </p>
          </CardContent>
        </Card>
      )}

      {pollGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Geen poll groepen gevonden voor {selectedMonth}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pollGroups.map(group => {
            const availableReferees = getAvailableReferees(group.poll_group_id);
            const assignedReferee = group.matches[0]?.assigned_referee_name;

            return (
              <Card key={group.poll_group_id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {group.location}
                      <Clock className="w-4 h-4 ml-2" />
                      {group.time_slot}
                    </CardTitle>
                    {getStatusBadge(group.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {group.match_count} wedstrijd(en)
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {availableReferees.length} beschikbaar
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <h4 className="font-medium">Wedstrijden:</h4>
                    {group.matches.map(match => (
                      <div key={match.match_id} className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">
                          {match.home_team_name} vs {match.away_team_name}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(match.match_date).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {assignedReferee ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">
                        Toegewezen: {assignedReferee}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-medium">Beschikbare scheidsrechters:</h4>
                      {availableReferees.length > 0 ? (
                        <div className="grid gap-2">
                          {availableReferees.map(referee => (
                            <div key={referee.user_id} className="flex items-center justify-between p-2 border rounded">
                              <span>{referee.username}</span>
                              <Button
                                size="sm"
                                onClick={() => handleAssignReferee(group.poll_group_id, referee.user_id)}
                              >
                                Toewijzen
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Geen scheidsrechters beschikbaar
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPollPage;