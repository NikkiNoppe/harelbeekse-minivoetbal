import React, { useState, memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, AlertTriangle, Save } from "lucide-react";
import { useTeamsData, type TeamFormData } from "@/hooks/useTeamsData";
import type { Team } from "@/services/enhancedTeamService";

// Loading skeleton components
const TeamsTableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Teamnaam</TableHead>
        <TableHead className="text-right">Saldo</TableHead>
        <TableHead className="text-right w-24">Acties</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(8)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

TeamsTableSkeleton.displayName = 'TeamsTableSkeleton';



// Error state component
const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>Er is een fout opgetreden bij het laden van de teams.</span>

    </AlertDescription>
  </Alert>
));

ErrorState.displayName = 'ErrorState';

// Team actions component
const TeamActions = memo(({ 
  team, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  team: Team; 
  onEdit: (team: Team) => void; 
  onDelete: (team: Team) => void;
  isDeleting: boolean;
}) => (
  <div className="flex items-center justify-end gap-1">
    <Button
      variant="outline"
      size="sm"
      onClick={() => onEdit(team)}
      className="h-8 w-8 p-0 bg-white text-purple-600 border-purple-400 hover:bg-purple-50"
      disabled={isDeleting}
    >
      <Edit className="h-4 w-4" />
    </Button>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-white text-red-500 border-red-400 hover:bg-red-50 hover:text-red-700"
          disabled={isDeleting}
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
            onClick={() => onDelete(team)}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? "Verwijderen..." : "Permanent Verwijderen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
));

TeamActions.displayName = 'TeamActions';

// Teams table component
const TeamsTable = memo(({ 
  teams, 
  editMode, 
  formatCurrency, 
  onEdit, 
  onDelete,
  isDeleting,
  sortBy,
  onSortChange
}: { 
  teams: Team[]; 
  editMode: boolean;
  formatCurrency: (amount: number) => string;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  isDeleting: boolean;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}) => (
  <div className="space-y-4">
    {/* Sort controls */}
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Sorteren op:</label>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Teamnaam (A-Z)</SelectItem>
          <SelectItem value="balance_desc">Hoogste saldo</SelectItem>
          <SelectItem value="balance">Laagste saldo</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Teamnaam</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          {editMode && <TableHead className="text-right w-24">Acties</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow key={team.team_id}>
            <TableCell className="font-medium text-responsive-team">{team.team_name}</TableCell>
            <TableCell className={`text-right font-semibold ${team.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(team.balance)}
            </TableCell>
            {editMode && (
              <TableCell className="text-right">
                <TeamActions 
                  team={team}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
));

TeamsTable.displayName = 'TeamsTable';

// Team form component
const TeamForm = memo(({ 
  teamName, 
  teamBalance, 
  onTeamNameChange, 
  onTeamBalanceChange, 
  onSave, 
  onCancel, 
  isSubmitting,
  isEdit = false
}: {
  teamName: string;
  teamBalance: string;
  onTeamNameChange: (value: string) => void;
  onTeamBalanceChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}) => (
  <div className="space-y-4 bg-purple-100">
    <div className="space-y-2">
      <Label htmlFor={isEdit ? "editTeamName" : "teamName"} className="text-purple-dark font-medium">Teamnaam</Label>
      <Input
        id={isEdit ? "editTeamName" : "teamName"}
        value={teamName}
        onChange={(e) => onTeamNameChange(e.target.value)}
        placeholder="Voer teamnaam in"
        className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={isEdit ? "editTeamBalance" : "teamBalance"} className="text-purple-dark font-medium">
        {isEdit ? "Saldo (€)" : "Startsaldo (€)"}
      </Label>
      <Input
        id={isEdit ? "editTeamBalance" : "teamBalance"}
        type="number"
        step="0.01"
        value={teamBalance}
        onChange={(e) => onTeamBalanceChange(e.target.value)}
        placeholder="0.00"
        className="bg-white placeholder:text-purple-200 border-purple-200 focus:border-purple-400"
      />
    </div>
    <div className="flex gap-2 pt-4">
      <Button 
        onClick={onSave} 
        disabled={isSubmitting}
        className="btn-dark"
      >
        {isSubmitting ? (isEdit ? "Opslaan..." : "Toevoegen...") : (isEdit ? "Opslaan" : "Toevoegen")}
      </Button>
      <Button 
        variant="outline" 
        onClick={onCancel}
        className="btn-light"
        disabled={isSubmitting}
      >
        Annuleren
      </Button>
    </div>
  </div>
));

TeamForm.displayName = 'TeamForm';

// Main component
const TeamsTab: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamBalance, setTeamBalance] = useState("0.00");
  const [editMode, setEditMode] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'balance_desc'>('name');

  const {
    teams,
    statistics,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    hasError,
    createTeam,
    updateTeam,
    deleteTeam,
    sortTeams,
    formatCurrency,
    refetch
  } = useTeamsData();

  // Memoized sorted teams
  const sortedTeams = useMemo(() => 
    sortTeams(teams, sortBy), 
    [teams, sortBy, sortTeams]
  );

  const handleAddTeam = () => {
    if (!teamName.trim()) return;

    const teamData: TeamFormData = {
      team_name: teamName.trim(),
      balance: parseFloat(teamBalance) || 0
    };

    createTeam(teamData);
    // Success is handled in the hook's onSuccess callback
    setIsAddModalOpen(false);
    setTeamName("");
    setTeamBalance("0.00");
  };

  const handleEditTeam = () => {
    if (!editingTeam || !teamName.trim()) return;

    const teamData: TeamFormData = {
      team_name: teamName.trim(),
      balance: parseFloat(teamBalance) || 0
    };

    updateTeam(editingTeam.team_id, teamData);
    // Success is handled in the hook's onSuccess callback
    closeEditModal();
  };

  const handleDeleteTeam = (team: Team) => {
    deleteTeam(team.team_id);
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

  const handleRetry = () => {
    refetch();
  };

  // Show error state
  if (hasError) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams Beheer
          </h2>
        </div>
        <ErrorState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams Beheer
        </h2>
      </div>



      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Beheer alle teams in de competitie
                </CardTitle>
                <CardDescription>
                  Verwijderen van teams zal automatisch alle gerelateerde spelers, transacties en gebruikers verwijderen.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <TeamsTableSkeleton />
            ) : (
              <TeamsTable
                teams={sortedTeams}
                editMode={true}
                formatCurrency={formatCurrency}
                onEdit={openEditModal}
                onDelete={handleDeleteTeam}
                isDeleting={isDeleting}
                sortBy={sortBy}
                onSortChange={(value) => setSortBy(value as 'name' | 'balance' | 'balance_desc')}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
              disabled={isCreating}
            >
              <Plus size={16} />
              Team toevoegen
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Add Team Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-purple-100 shadow-lg border-purple-200">
          <DialogHeader className="bg-purple-100">
            <DialogTitle className="text-2xl text-center text-purple-light">Nieuw Team Toevoegen</DialogTitle>
            <DialogDescription className="text-center text-purple-dark">
              Voeg een nieuw team toe aan de competitie met een beginsaldo.
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            teamName={teamName}
            teamBalance={teamBalance}
            onTeamNameChange={setTeamName}
            onTeamBalanceChange={setTeamBalance}
            onSave={handleAddTeam}
            onCancel={() => setIsAddModalOpen(false)}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Team Modal */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="bg-purple-100 shadow-lg border-purple-200">
          <DialogHeader className="bg-purple-100">
            <DialogTitle className="text-2xl text-center text-purple-light">Team Bewerken</DialogTitle>
            <DialogDescription className="text-center text-purple-dark">
              Bewerk de teamnaam en het saldo van het geselecteerde team.
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            teamName={teamName}
            teamBalance={teamBalance}
            onTeamNameChange={setTeamName}
            onTeamBalanceChange={setTeamBalance}
            onSave={handleEditTeam}
            onCancel={closeEditModal}
            isSubmitting={isUpdating}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(TeamsTab);
