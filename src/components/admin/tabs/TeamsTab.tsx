
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, AlertTriangle } from "lucide-react";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

interface TeamDependencies {
  players: number;
  matches: number;
  transactions: number;
  users: number;
}

const TeamsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamBalance, setTeamBalance] = useState("0.00");

  // Fetch teams
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');
      
      if (error) throw error;
      return data as Team[];
    }
  });

  // Get team dependencies
  const getTeamDependencies = async (teamId: number): Promise<TeamDependencies> => {
    const [playersResult, matchesResult, transactionsResult, usersResult] = await Promise.all([
      supabase.from('players').select('player_id').eq('team_id', teamId),
      supabase.from('matches').select('match_id').or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`),
      supabase.from('team_transactions').select('id').eq('team_id', teamId),
      supabase.from('team_users').select('id').eq('team_id', teamId)
    ]);

    return {
      players: playersResult.data?.length || 0,
      matches: matchesResult.data?.length || 0,
      transactions: transactionsResult.data?.length || 0,
      users: usersResult.data?.length || 0
    };
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Fout",
        description: "Vul een teamnaam in",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .insert([{
          team_name: teamName.trim(),
          balance: parseFloat(teamBalance) || 0
        }]);

      if (error) throw error;

      toast({
        title: "Succesvol",
        description: "Team succesvol toegevoegd"
      });

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
      setIsAddModalOpen(false);
      setTeamName("");
      setTeamBalance("0.00");
    } catch (error) {
      console.error('Add team error:', error);
      toast({
        title: "Fout",
        description: "Fout bij toevoegen team",
        variant: "destructive"
      });
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam || !teamName.trim()) {
      toast({
        title: "Fout",
        description: "Vul een teamnaam in",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          team_name: teamName.trim(),
          balance: parseFloat(teamBalance) || 0
        })
        .eq('team_id', editingTeam.team_id);

      if (error) throw error;

      toast({
        title: "Succesvol",
        description: "Team succesvol bijgewerkt"
      });

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
      setEditingTeam(null);
      setTeamName("");
      setTeamBalance("0.00");
    } catch (error) {
      console.error('Update team error:', error);
      toast({
        title: "Fout",
        description: "Fout bij bijwerken team",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    try {
      const dependencies = await getTeamDependencies(team.team_id);
      
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', team.team_id);

      if (error) throw error;

      toast({
        title: "Succesvol",
        description: `Team "${team.team_name}" succesvol verwijderd. ${dependencies.players} spelers, ${dependencies.transactions} transacties en ${dependencies.users} gebruikers zijn automatisch verwijderd.`
      });

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams-financial'] });
    } catch (error) {
      console.error('Delete team error:', error);
      toast({
        title: "Fout",
        description: "Fout bij verwijderen team",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.team_name);
    setTeamBalance(team.balance.toString());
  };

  const closeEditModal = () => {
    setEditingTeam(null);
    setTeamName("");
    setTeamBalance("0.00");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-40">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams Beheer
              </CardTitle>
              <CardDescription>
                Beheer alle teams in de competitie. Verwijderen van teams zal automatisch alle gerelateerde spelers, transacties en gebruikers verwijderen.
              </CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nieuw Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuw Team Toevoegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Teamnaam</Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Voer teamnaam in"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamBalance">Startsaldo (€)</Label>
                    <Input
                      id="teamBalance"
                      type="number"
                      step="0.01"
                      value={teamBalance}
                      onChange={(e) => setTeamBalance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddTeam}>Toevoegen</Button>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teamnaam</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map((team) => (
                <TableRow key={team.team_id}>
                  <TableCell className="font-medium">{team.team_name}</TableCell>
                  <TableCell className={`text-right font-semibold ${team.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(team.balance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(team)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Bewerken
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Verwijderen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Team Verwijderen
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-2">
                                <p>Weet je zeker dat je het team "{team.team_name}" wilt verwijderen?</p>
                                <p className="font-semibold text-red-600">
                                  ⚠️ Dit zal automatisch verwijderen:
                                </p>
                                <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                                  <li>Alle spelers van dit team</li>
                                  <li>Alle financiële transacties</li>
                                  <li>Alle team gebruikers</li>
                                  <li>Team voorkeuren en instellingen</li>
                                </ul>
                                <p className="text-sm text-gray-600">
                                  Wedstrijden worden behouden maar worden losgekoppeld van dit team.
                                </p>
                                <p className="font-semibold">Deze actie kan niet ongedaan worden gemaakt!</p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTeam(team)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Permanent Verwijderen
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
        </CardContent>
      </Card>

      {/* Edit Team Modal */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTeamName">Teamnaam</Label>
              <Input
                id="editTeamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Voer teamnaam in"
              />
            </div>
            <div>
              <Label htmlFor="editTeamBalance">Saldo (€)</Label>
              <Input
                id="editTeamBalance"
                type="number"
                step="0.01"
                value={teamBalance}
                onChange={(e) => setTeamBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditTeam}>Opslaan</Button>
              <Button variant="outline" onClick={closeEditModal}>
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsTab;
