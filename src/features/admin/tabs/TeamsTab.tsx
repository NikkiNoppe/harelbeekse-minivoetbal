import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@shared/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@shared/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks/use-toast";
import { Plus, Edit, Trash2, Users, AlertTriangle } from "lucide-react";
import { enhancedTeamService, Team } from "@shared/services/enhancedTeamService";

const TeamsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamBalance, setTeamBalance] = useState("0.00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch teams using enhanced service
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      console.log('[TeamsTab] Fetching teams...');
      const teams = await enhancedTeamService.getAllTeams();
      console.log('[TeamsTab] Teams fetched:', teams);
      return teams;
    }
  });

  const handleAddTeam = async () => {
    console.log('[TeamsTab] Adding team:', { teamName, teamBalance });
    
    if (!teamName.trim()) {
      toast({
        title: "Fout",
        description: "Vul een teamnaam in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await enhancedTeamService.createTeam({
        team_name: teamName.trim(),
        balance: parseFloat(teamBalance) || 0
      });

      console.log('[TeamsTab] Add team result:', result);

      if (result.success) {
        toast({
          title: "Team toegevoegd",
          description: result.message
        });

        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setIsAddModalOpen(false);
        setTeamName("");
        setTeamBalance("0.00");
      } else {
        toast({
          title: "Fout bij toevoegen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[TeamsTab] Add team error:', error);
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het team",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = async () => {
    console.log('[TeamsTab] Editing team:', { editingTeam, teamName });
    
    if (!editingTeam || !teamName.trim()) {
      toast({
        title: "Fout",
        description: "Vul een teamnaam in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await enhancedTeamService.updateTeam(editingTeam.team_id, {
        team_name: teamName.trim()
      });

      console.log('[TeamsTab] Edit team result:', result);

      if (result.success) {
        toast({
          title: "Team bijgewerkt",
          description: result.message
        });

        queryClient.invalidateQueries({ queryKey: ['teams'] });
        closeEditModal();
      } else {
        toast({
          title: "Fout bij bijwerken",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[TeamsTab] Edit team error:', error);
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het team",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    console.log('[TeamsTab] Deleting team:', team);
    
    try {
      const result = await enhancedTeamService.deleteTeam(team.team_id);

      console.log('[TeamsTab] Delete team result:', result);

      if (result.success) {
        toast({
          title: "Team verwijderd",
          description: result.message
        });

        queryClient.invalidateQueries({ queryKey: ['teams'] });
      } else {
        toast({
          title: "Fout bij verwijderen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[TeamsTab] Delete team error:', error);
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het team",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (team: Team) => {
    console.log('[TeamsTab] Opening edit modal for team:', team);
    setEditingTeam(team);
    setTeamName(team.team_name);
    setTeamBalance(team.balance.toString());
  };

  const closeEditModal = () => {
    console.log('[TeamsTab] Closing edit modal');
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
              <DialogContent className="bg-purple-100 shadow-lg border-purple-200">
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
                    <Button onClick={handleAddTeam} disabled={isSubmitting}>
                      {isSubmitting ? "Toevoegen..." : "Toevoegen"}
                    </Button>
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
                <TableHead className="text-right w-24">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map((team) => (
                <TableRow key={team.team_id}>
                  <TableCell className="font-medium">{team.team_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(team)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-purple-100 shadow-lg border-purple-200">
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
        <DialogContent className="bg-purple-100 shadow-lg border-purple-200">
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

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditTeam} disabled={isSubmitting}>
                {isSubmitting ? "Opslaan..." : "Opslaan"}
              </Button>
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
