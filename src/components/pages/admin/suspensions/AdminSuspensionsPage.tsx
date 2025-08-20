import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suspensionService } from '@/services';
import { useSuspensionsData } from '@/hooks/useSuspensionsData';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllCards, type CardData } from '@/services/match';
import ResponsiveCardsTable from '@/components/tables/ResponsiveCardsTable';

interface ManualSuspension {
  id: number;
  playerId: number;
  playerName?: string;
  teamName?: string;
  reason: string;
  matches: number;
  startDate: string;
  endDate: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

const AdminSuspensionsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSuspension, setEditingSuspension] = useState<ManualSuspension | null>(null);
  const [newSuspension, setNewSuspension] = useState({
    teamId: '',
    playerId: '',
    reason: '',
    matches: '1',
    notes: ''
  });

  // Fetch data
  const { playerCards, suspensions, isLoading } = useSuspensionsData();

  // Niet meer automatisch vernieuwen bij openen; data wordt via queries opgehaald.
  
  // Kaarten uit wedstrijdformulieren (alle gele/rode kaarten)
  const { data: allCards, isLoading: isCardsLoading } = useQuery({
    queryKey: ['allCardsAdmin'],
    queryFn: fetchAllCards
  });
  
  // Groepeer kaarten per speler
  const playerCardSummaries = React.useMemo(() => {
    if (!allCards) return [] as Array<{
      playerId: number; playerName: string; teamName: string; yellowCards: number; redCards: number; totalCards: number; isSuspended: boolean; suspensionReason?: string; cards: CardData[];
    }>;
    const groups = allCards.reduce((acc, card) => {
      const key = `${card.playerId}-${card.playerName}`;
      if (!acc[key]) {
        acc[key] = { playerId: card.playerId, playerName: card.playerName, teamName: card.teamName, cards: [] as CardData[] };
      }
      acc[key].cards.push(card);
      return acc;
    }, {} as Record<string, { playerId: number; playerName: string; teamName: string; cards: CardData[] }>);
    return Object.values(groups).map(group => {
      const yellowCards = group.cards.filter(c => c.cardType === 'yellow').length;
      const redCards = group.cards.filter(c => c.cardType === 'red').length;
      const totalCards = yellowCards + redCards;
      const isSuspended = false; // We tonen enkel wie kaarten heeft; status niet verplicht
      return {
        playerId: group.playerId,
        playerName: group.playerName,
        teamName: group.teamName,
        yellowCards,
        redCards,
        totalCards,
        isSuspended,
        cards: group.cards,
      };
    }).sort((a, b) => b.totalCards - a.totalCards);
  }, [allCards]);
  
  const manualSuspensionsQuery = useQuery({
    queryKey: ['manualSuspensions'],
    queryFn: suspensionService.getManualSuspensions
  });

  const teamsQuery = useQuery({
    queryKey: ['allTeams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      if (error) throw error;
      return data as { team_id: number; team_name: string }[];
    }
  });

  const playersQuery = useQuery({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          player_id,
          first_name,
          last_name,
          team_id,
          teams:team_id (team_name)
        `)
        .order('first_name');
      
      if (error) throw error;
      return data.map(p => ({
        playerId: p.player_id,
        playerName: `${p.first_name} ${p.last_name}`,
        teamName: p.teams?.team_name || 'Onbekend Team',
        teamId: p.team_id as number
      }));
    }
  });

  const filteredPlayers = React.useMemo(() => {
    if (!playersQuery.data || !newSuspension.teamId) return [] as { playerId: number; playerName: string; teamName: string; teamId: number }[];
    const teamIdNum = parseInt(newSuspension.teamId);
    return playersQuery.data.filter(p => p.teamId === teamIdNum);
  }, [playersQuery.data, newSuspension.teamId]);

  // Mutations
  const addSuspensionMutation = useMutation({
    mutationFn: (data: any) => suspensionService.applySuspension(
      parseInt(data.playerId),
      data.reason,
      parseInt(data.matches),
      data.notes
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualSuspensions'] });
      setIsAddDialogOpen(false);
      setNewSuspension({ teamId: '', playerId: '', reason: '', matches: '1', notes: '' });
      toast({
        title: "Schorsing toegevoegd",
        description: "De schorsing is succesvol toegevoegd."
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de schorsing.",
        variant: "destructive"
      });
    }
  });

  const updateSuspensionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      suspensionService.updateSuspension(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualSuspensions'] });
      setEditingSuspension(null);
      toast({
        title: "Schorsing bijgewerkt",
        description: "De schorsing is succesvol bijgewerkt."
      });
    }
  });

  const deleteSuspensionMutation = useMutation({
    mutationFn: suspensionService.deleteSuspension,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualSuspensions'] });
      toast({
        title: "Schorsing verwijderd",
        description: "De schorsing is succesvol verwijderd."
      });
    }
  });

  const handleAddSuspension = () => {
    addSuspensionMutation.mutate(newSuspension);
  };

  const handleUpdateSuspension = (suspension: ManualSuspension) => {
    updateSuspensionMutation.mutate({
      id: suspension.id,
      data: {
        reason: suspension.reason,
        matches: suspension.matches,
        notes: suspension.notes,
        isActive: suspension.isActive
      }
    });
  };

  const getSuspendedPlayers = () => {
    return playerCards?.filter(player => player.suspendedMatches && player.suspendedMatches > 0) || [];
  };

  const getPlayerName = (playerId: number) => {
    const player = playersQuery.data?.find(p => p.playerId === playerId);
    return player ? `${player.playerName} (${player.teamName})` : `Speler ${playerId}`;
  };

  if (isLoading || manualSuspensionsQuery.isLoading || playersQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const suspendedPlayers = getSuspendedPlayers();
  const manualSuspensions = manualSuspensionsQuery.data || [];
  const activeSuspensions = manualSuspensions.filter(s => s.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schorsingen Beheer</h1>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn btn--outline flex items-center gap-2">
                <Plus className="h-4 w-4 mr-2" />
                Schorsing Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent className="modal">
              <DialogHeader>
                <DialogTitle className="modal__title">Nieuwe Schorsing Toevoegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team">Team</Label>
                  <Select value={newSuspension.teamId} onValueChange={(value) =>
                    setNewSuspension(prev => ({ ...prev, teamId: value, playerId: '' }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={teamsQuery.isLoading ? 'Teams laden...' : 'Selecteer team'} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsQuery.data?.map(team => (
                        <SelectItem key={team.team_id} value={team.team_id.toString()}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="player">Speler</Label>
                  <Select value={newSuspension.playerId} onValueChange={(value) =>
                    setNewSuspension(prev => ({ ...prev, playerId: value }))
                  } disabled={!newSuspension.teamId}>
                    <SelectTrigger>
                      <SelectValue placeholder={!newSuspension.teamId ? 'Selecteer eerst een team' : (playersQuery.isLoading ? 'Spelers laden...' : 'Selecteer speler')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPlayers.map(player => (
                        <SelectItem key={player.playerId} value={player.playerId.toString()}>
                          {player.playerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reason">Reden</Label>
                  <Input
                    id="reason"
                    value={newSuspension.reason}
                    onChange={(e) => setNewSuspension(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Bijv. Rode kaart - grove overtreding"
                  />
                </div>
                <div>
                  <Label htmlFor="matches">Aantal wedstrijden</Label>
                  <Input
                    id="matches"
                    type="number"
                    min="1"
                    max="10"
                    value={newSuspension.matches}
                    onChange={(e) => setNewSuspension(prev => ({ ...prev, matches: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Opmerkingen (optioneel)</Label>
                  <Textarea
                    id="notes"
                    value={newSuspension.notes}
                    onChange={(e) => setNewSuspension(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Extra opmerkingen over de schorsing"
                  />
                </div>
                <div className="modal__actions">
                  <Button 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="btn btn--secondary flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button 
                    onClick={handleAddSuspension} 
                    disabled={!newSuspension.teamId || !newSuspension.playerId || !newSuspension.reason}
                    className="btn btn--primary flex-1"
                  >
                    Toevoegen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lijst van spelers die kaarten hebben (uit wedstrijdformulieren) */}
      <Card>
        <CardHeader>
          <CardTitle>Spelers met Kaarten (wedstrijdformulieren)</CardTitle>
        </CardHeader>
        <CardContent>
          {isCardsLoading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Laden...
            </div>
          ) : (
            <ResponsiveCardsTable playerSummaries={playerCardSummaries} sticky={false} />
          )}
        </CardContent>
      </Card>

      {/* Actieve Schorsingen - gecombineerd overzicht (automatisch + handmatig) */}
      {(() => {
        const activeManual = manualSuspensions.filter(s => s.isActive);
        const getPlayerDetails = (playerId: number) => {
          const match = playersQuery.data?.find(p => p.playerId === playerId);
          return {
            playerName: match ? match.playerName : `Speler ${playerId}`,
            teamName: match ? match.teamName : 'Onbekend Team'
          };
        };
        const unified = [
          ...suspendedPlayers.map(p => ({
            key: `auto-${p.playerId}`,
            playerId: p.playerId,
            playerName: p.playerName,
            teamName: p.teamName,
            type: 'Automatisch',
            reason: 'Kaarten/systeemregel',
            remaining: p.suspendedMatches,
            matches: p.suspendedMatches
          })),
          ...activeManual.map(s => {
            const details = getPlayerDetails(s.playerId);
            return {
              key: `manual-${s.id}`,
              playerId: s.playerId,
              playerName: details.playerName,
              teamName: details.teamName,
              type: 'Handmatig',
              reason: s.reason,
              remaining: s.matches,
              matches: s.matches
            };
          })
        ].sort((a, b) => a.playerName.localeCompare(b.playerName));

        if (unified.length === 0) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Actieve Schorsingen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">Geen actieve schorsingen</div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle>Actieve Schorsingen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-0 lg:min-w-[900px] table-no-inner-scroll-mobile">
                  <Table className="table w-full text-sm md:text-base">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Speler</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[160px]">Team</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[120px]">Type</TableHead>
                        <TableHead className="hidden lg:table-cell min-w-[200px]">Reden</TableHead>
                        <TableHead className="text-center min-w-[120px]">Resterend</TableHead>
                        <TableHead className="text-center min-w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unified.map(item => (
                        <TableRow key={item.key}>
                          <TableCell className="font-medium truncate max-w-[180px] sm:max-w-[220px] text-xs sm:text-sm" title={`${item.playerName} (${item.teamName})`}>
                            {item.playerName}
                          </TableCell>
                          <TableCell className="hidden md:table-cell truncate max-w-[220px] text-xs sm:text-sm">{item.teamName}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className={item.type === 'Automatisch' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell truncate max-w-[260px] text-xs sm:text-sm">{item.reason}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">{item.remaining} wedstrijd{item.remaining !== 1 ? 'en' : ''}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">Actief</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Manual Suspensions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Handmatige Schorsingen</CardTitle>
        </CardHeader>
        <CardContent>
          {manualSuspensions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen handmatige schorsingen gevonden
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-0 lg:min-w-[1000px] table-no-inner-scroll-mobile">
                <Table className="table w-full text-sm md:text-base">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Speler</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[220px]">Reden</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[120px]">Wedstrijden</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[120px]">Status</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[140px]">Aangemaakt</TableHead>
                      <TableHead className="text-center min-w-[120px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualSuspensions.map(suspension => (
                      <TableRow key={suspension.id}>
                        <TableCell className="font-medium truncate max-w-[200px] sm:max-w-[260px] text-xs sm:text-sm" title={getPlayerName(suspension.playerId)}>
                          {getPlayerName(suspension.playerId)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell truncate max-w-[260px] text-xs sm:text-sm">{suspension.reason}</TableCell>
                        <TableCell className="hidden sm:table-cell">{suspension.matches}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={suspension.isActive ? 'destructive' : 'secondary'}>
                            {suspension.isActive ? 'Actief' : 'Inactief'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(suspension.createdAt).toLocaleDateString('nl-NL')}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              onClick={() => setEditingSuspension(suspension)}
                              className="btn btn--icon btn--edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="btn btn--icon btn--danger">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="modal">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="modal__title">Schorsing verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je deze schorsing wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="modal__actions">
                                  <AlertDialogCancel className="btn btn--secondary">Annuleren</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteSuspensionMutation.mutate(suspension.id)}
                                    className="btn btn--danger"
                                  >
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Suspension Dialog */}
      {editingSuspension && (
        <Dialog open={!!editingSuspension} onOpenChange={() => setEditingSuspension(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schorsing Bewerken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Speler</Label>
                <div className="p-2 bg-muted rounded">
                  {getPlayerName(editingSuspension.playerId)}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-reason">Reden</Label>
                <Input
                  id="edit-reason"
                  value={editingSuspension.reason}
                  onChange={(e) => setEditingSuspension(prev => prev ? { ...prev, reason: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-matches">Aantal wedstrijden</Label>
                <Input
                  id="edit-matches"
                  type="number"
                  min="1"
                  max="10"
                  value={editingSuspension.matches}
                  onChange={(e) => setEditingSuspension(prev => prev ? { ...prev, matches: parseInt(e.target.value) } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Opmerkingen</Label>
                <Textarea
                  id="edit-notes"
                  value={editingSuspension.notes || ''}
                  onChange={(e) => setEditingSuspension(prev => prev ? { ...prev, notes: e.target.value } : null)}
                />
              </div>
              <Button 
                onClick={() => handleUpdateSuspension(editingSuspension)} 
                className="w-full"
              >
                Wijzigingen Opslaan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminSuspensionsPage;