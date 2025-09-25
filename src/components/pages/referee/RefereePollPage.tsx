import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { pollService, PollGroup } from '@/services/poll/pollService';
import { MapPin, Clock, CalendarDays, Users } from 'lucide-react';

interface RefereePollPageProps {
  userId: number;
  username: string;
}

const RefereePollPage: React.FC<RefereePollPageProps> = ({ userId, username }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [pollGroups, setPollGroups] = useState<PollGroup[]>([]);
  const [myAvailability, setMyAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
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
      const [groups, availability] = await Promise.all([
        pollService.getMonthlyPollData(selectedMonth),
        pollService.getRefereeAvailability(selectedMonth)
      ]);

      setPollGroups(groups);

      // Find my availability
      const myAvail = availability.find(ref => ref.user_id === userId);
      setMyAvailability(myAvail?.availability || {});
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
  }, [selectedMonth, userId]);

  const handleAvailabilityChange = async (pollGroupId: string, isAvailable: boolean) => {
    setSaving(pollGroupId);
    try {
      const success = await pollService.updateRefereeAvailability(
        userId,
        pollGroupId,
        selectedMonth,
        isAvailable
      );

      if (success) {
        setMyAvailability(prev => ({
          ...prev,
          [pollGroupId]: isAvailable
        }));
        toast({
          title: "Beschikbaarheid bijgewerkt",
          description: `Je bent nu ${isAvailable ? 'beschikbaar' : 'niet beschikbaar'} voor deze wedstrijdgroep`,
        });
      } else {
        toast({
          title: "Error",
          description: "Kon beschikbaarheid niet bijwerken",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Er ging iets mis bij het bijwerken van je beschikbaarheid",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const getStatusBadge = (group: PollGroup) => {
    const isAssignedToMe = group.matches.some(match => 
      match.assigned_referee_id === userId
    );

    if (isAssignedToMe) {
      return <Badge variant="default" className="bg-green-600">Toegewezen aan jou</Badge>;
    }

    if (group.status === 'confirmed') {
      return <Badge variant="outline">Toegewezen aan ander</Badge>;
    }

    return <Badge variant="secondary">Open voor poll</Badge>;
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
        <h1 className="text-2xl font-bold">Mijn Beschikbaarheid</h1>
        <div className="text-sm text-muted-foreground">
          Ingelogd als: {username}
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

      {pollGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Geen polls beschikbaar voor {selectedMonth}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pollGroups.map(group => {
            const isAvailable = myAvailability[group.poll_group_id] || false;
            const isAssignedToMe = group.matches.some(match => 
              match.assigned_referee_id === userId
            );
            const isSaving = saving === group.poll_group_id;

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
                    {getStatusBadge(group)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {group.match_count} wedstrijd(en)
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <h4 className="font-medium">Wedstrijden:</h4>
                    {group.matches.map(match => (
                      <div key={match.match_id} className="text-sm p-2 bg-muted rounded">
                        <div className="font-medium">
                          {match.home_team_name} vs {match.away_team_name}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(match.match_date).toLocaleDateString('nl-NL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {group.status !== 'confirmed' || isAssignedToMe ? (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">
                        Ben je beschikbaar voor deze wedstrijdgroep?
                      </span>
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={(checked) => handleAvailabilityChange(group.poll_group_id, checked)}
                        disabled={isSaving || isAssignedToMe}
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                      Deze wedstrijdgroep is al toegewezen aan een andere scheidsrechter.
                    </div>
                  )}

                  {isAssignedToMe && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 font-medium">
                        🎉 Je bent toegewezen aan deze wedstrijdgroep!
                      </p>
                      <p className="text-green-700 text-sm mt-1">
                        Zorg ervoor dat je op tijd aanwezig bent voor alle wedstrijden.
                      </p>
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

export default RefereePollPage;