
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { User, Mail, UserPlus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UserDialog from "@/components/user/UserDialog";

interface Team {
  team_id: number;
  team_name: string;
}

interface NewUserData {
  name: string;
  email: string;
  role: "admin" | "referee" | "player_manager"; // Updated to match database enum
  teamId: number | null;
}

interface DbUser {
  user_id: number;
  username: string;
  role: string;
  team_id?: number | null;
  team_name?: string | null;
}

const UserManagementTab: React.FC = () => {
  const { toast } = useToast();
  
  const [newUser, setNewUser] = useState<NewUserData>({
    name: "",
    email: "",
    role: "player_manager", // Changed default from "team" to "player_manager"
    teamId: null
  });
  
  const [users, setUsers] = useState<DbUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // For user edit functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  
  // Fetch users and teams from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (teamsError) throw teamsError;
        
        // Fetch users with team names
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select(`
            user_id,
            username,
            role,
            teams (
              team_id,
              team_name
            )
          `);
        
        if (usersError) throw usersError;
        
        // Transform the data
        const formattedUsers: DbUser[] = usersData.map(user => ({
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          team_id: user.teams ? user.teams.team_id : null,
          team_name: user.teams ? user.teams.team_name : null
        }));
        
        setTeams(teamsData || []);
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van gebruikersgegevens.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);
  
  const handleAddUser = async () => {
    // Validate form
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Fout",
        description: "Naam en e-mail zijn verplicht",
        variant: "destructive"
      });
      return;
    }
    
    if (newUser.role === "player_manager" && !newUser.teamId) {
      toast({
        title: "Fout",
        description: "Selecteer een team voor deze gebruiker",
        variant: "destructive"
      });
      return;
    }
    
    if (!newUser.email.includes('@')) {
      toast({
        title: "Fout",
        description: "Vul een geldig e-mailadres in",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Insert new user into Supabase
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: newUser.name,
          password: 'temporary_password', // In a real app, this would be handled more securely
          role: newUser.role,
          // Note: team_id would be managed through a separate relationship
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0] && newUser.role === "player_manager" && newUser.teamId) {
        // Update team with manager reference if user is a team manager
        const { error: teamError } = await supabase
          .from('teams')
          .update({ player_manager_id: data[0].user_id })
          .eq('team_id', newUser.teamId);
        
        if (teamError) throw teamError;
      }
      
      toast({
        title: "Gebruiker toegevoegd",
        description: `${newUser.name} is toegevoegd als gebruiker.`
      });
      
      // Refresh user list
      const { data: refreshedUsers, error: refreshError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          role,
          teams (
            team_id,
            team_name
          )
        `);
      
      if (!refreshError && refreshedUsers) {
        const formattedUsers: DbUser[] = refreshedUsers.map(user => ({
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          team_id: user.teams ? user.teams.team_id : null,
          team_name: user.teams ? user.teams.team_name : null
        }));
        
        setUsers(formattedUsers);
      }
      
      // Reset form
      setNewUser({
        name: "",
        email: "",
        role: "player_manager",
        teamId: null
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de gebruiker.",
        variant: "destructive"
      });
    }
  };

  const handleOpenEditDialog = (user: DbUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };
  
  const handleUpdateUser = async (formData: any) => {
    if (!editingUser) return;
    
    try {
      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          ...(formData.password ? { password: formData.password } : {}),
          role: formData.role,
        })
        .eq('user_id', editingUser.user_id);
      
      if (error) throw error;
      
      // Handle team association if user is a player_manager
      if (formData.role === "player_manager") {
        // First, remove any existing team association for this user
        if (editingUser.team_id) {
          const { error: resetError } = await supabase
            .from('teams')
            .update({ player_manager_id: null })
            .eq('player_manager_id', editingUser.user_id);
          
          if (resetError) throw resetError;
        }
        
        // Then, set the new team association
        if (formData.teamId) {
          const { error: teamError } = await supabase
            .from('teams')
            .update({ player_manager_id: editingUser.user_id })
            .eq('team_id', formData.teamId);
          
          if (teamError) throw teamError;
        }
      } else if (editingUser.team_id) {
        // If user is no longer a player_manager, remove any team association
        const { error: resetError } = await supabase
          .from('teams')
          .update({ player_manager_id: null })
          .eq('player_manager_id', editingUser.user_id);
        
        if (resetError) throw resetError;
      }
      
      toast({
        title: "Gebruiker bijgewerkt",
        description: `${formData.username} is bijgewerkt.`
      });
      
      // Refresh user list
      const { data: refreshedUsers, error: refreshError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          role,
          teams (
            team_id,
            team_name
          )
        `);
      
      if (!refreshError && refreshedUsers) {
        const formattedUsers: DbUser[] = refreshedUsers.map(user => ({
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          team_id: user.teams ? user.teams.team_id : null,
          team_name: user.teams ? user.teams.team_name : null
        }));
        
        setUsers(formattedUsers);
      }
      
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de gebruiker.",
        variant: "destructive"
      });
    }
  };
  
  const handleOpenDeleteConfirmation = (userId: number) => {
    setSelectedUserId(userId);
    setConfirmDialogOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (selectedUserId === null) return;
    
    try {
      // First, check if this user is a player_manager for any team
      const { data: teamData } = await supabase
        .from('teams')
        .select('team_id')
        .eq('player_manager_id', selectedUserId);
      
      // If they are a player_manager, remove the reference from the team
      if (teamData && teamData.length > 0) {
        const { error: teamError } = await supabase
          .from('teams')
          .update({ player_manager_id: null })
          .eq('player_manager_id', selectedUserId);
        
        if (teamError) throw teamError;
      }
      
      // Now delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', selectedUserId);
      
      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.user_id !== selectedUserId));
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de gebruiker.",
        variant: "destructive"
      });
    } finally {
      setConfirmDialogOpen(false);
      setSelectedUserId(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gebruikers Beheren</CardTitle>
          <CardDescription>Voeg nieuwe gebruikers toe en beheer hun toegang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nieuwe gebruiker toevoegen</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Naam</Label>
                  <Input 
                    id="name" 
                    placeholder="Volledige naam"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="E-mailadres"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value: "admin" | "referee" | "player_manager") => {
                      setNewUser({
                        ...newUser, 
                        role: value,
                        // Reset teamId if role is not player_manager
                        teamId: value === "player_manager" ? newUser.teamId : null
                      });
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecteer een rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="player_manager">Teamverantwoordelijke</SelectItem>
                      <SelectItem value="referee">Scheidsrechter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newUser.role === "player_manager" && (
                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select 
                      value={newUser.teamId?.toString() || ""} 
                      onValueChange={(value) => {
                        setNewUser({
                          ...newUser,
                          teamId: value ? parseInt(value) : null
                        });
                      }}
                    >
                      <SelectTrigger id="team">
                        <SelectValue placeholder="Selecteer een team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.team_id} value={team.team_id.toString()}>
                            {team.team_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleAddUser}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Gebruiker toevoegen
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="mb-4 text-lg font-medium">Gebruikers</h3>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          Gebruikers laden...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          Geen gebruikers gevonden
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map(user => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {user.username}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" && "Administrator"}
                            {user.role === "player_manager" && "Teamverantwoordelijke"}
                            {user.role === "referee" && "Scheidsrechter"}
                          </TableCell>
                          <TableCell>
                            {user.team_name || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditDialog(user)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Bewerken</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteConfirmation(user.user_id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Verwijderen</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebruiker verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze gebruiker wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {editingUser && (
        <UserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editingUser={{
            id: editingUser.user_id,
            username: editingUser.username,
            password: "",
            role: editingUser.role as "admin" | "referee" | "player_manager",
            teamId: editingUser.team_id || undefined
          }}
          onSave={handleUpdateUser}
          teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
        />
      )}
    </div>
  );
};

export default UserManagementTab;
