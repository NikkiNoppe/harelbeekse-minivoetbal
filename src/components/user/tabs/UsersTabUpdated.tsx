
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { User } from "@/types/auth";
import UserRow from "@/components/user/UserRow";
import UserDialog from "@/components/user/UserDialog";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  team_id: number;
  team_name: string;
}

interface TeamUser {
  user_id: number;
  team_id: number;
  team_name: string;
}

const UsersTabUpdated: React.FC = () => {
  const { toast } = useToast();
  const { allUsers, updateUser, addUser, removeUser } = useAuth();
  const [users, setUsers] = useState<User[]>(allUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch teams and team-user relationships from Supabase
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
        setTeams(teamsData || []);
        
        // Fetch team-user relationships
        const { data: teamUsersData, error: teamUsersError } = await supabase
          .from('team_users')
          .select(`
            user_id,
            team_id,
            teams!inner(team_name)
          `);
        
        if (teamUsersError) {
          console.error('Error fetching team users:', teamUsersError);
          // Don't throw here, just log the error
        } else {
          const mappedTeamUsers: TeamUser[] = (teamUsersData || []).map(item => ({
            user_id: item.user_id,
            team_id: item.team_id,
            team_name: (item.teams as any)?.team_name || 'Unknown Team'
          }));
          setTeamUsers(mappedTeamUsers);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de gegevens.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);
  
  // Handle opening edit dialog
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };
  
  // Handle opening add dialog
  const handleAddNew = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };
  
  // Handle save user
  const handleSaveUser = async (formData: any) => {
    const currentEditingUser = editingUser;
    
    if (currentEditingUser) {
      // Update existing user
      const updatedUser: User = {
        ...currentEditingUser,
        username: formData.username,
        ...(formData.password ? { password: formData.password } : {}),
        role: formData.role,
        ...(formData.role === "player_manager" ? { teamId: formData.teamId } : {})
      };
      
      updateUser(updatedUser);
      setUsers(allUsers.map(user => 
        user.id === currentEditingUser.id ? updatedUser : user
      ));
      
      // Update team assignment in Supabase if role is player_manager
      if (formData.role === "player_manager" && formData.teamId) {
        try {
          // First, remove existing team assignment
          await supabase
            .from('team_users')
            .delete()
            .eq('user_id', currentEditingUser.id);
          
          // Then add new team assignment
          await supabase
            .from('team_users')
            .insert({
              user_id: currentEditingUser.id,
              team_id: formData.teamId
            });
        } catch (error) {
          console.error('Error updating team assignment:', error);
          toast({
            title: "Waarschuwing",
            description: "Gebruiker bijgewerkt, maar teamtoewijzing kon niet worden opgeslagen.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Gebruiker bijgewerkt",
        description: `${formData.username} is bijgewerkt`,
      });
    } else {
      // Add new user
      const newId = Math.max(...users.map(u => u.id), 0) + 1;
      
      const userToAdd: User = {
        id: newId,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        ...(formData.role === "player_manager" && formData.teamId ? { teamId: formData.teamId } : {})
      };
      
      addUser(userToAdd);
      setUsers([...users, userToAdd]);
      
      // Add team assignment in Supabase if role is player_manager
      if (formData.role === "player_manager" && formData.teamId) {
        try {
          await supabase
            .from('team_users')
            .insert({
              user_id: newId,
              team_id: formData.teamId
            });
        } catch (error) {
          console.error('Error adding team assignment:', error);
          toast({
            title: "Waarschuwing",
            description: "Gebruiker toegevoegd, maar teamtoewijzing kon niet worden opgeslagen.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Gebruiker toegevoegd",
        description: `${formData.username} is toegevoegd`,
      });
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    // Remove team assignment from Supabase first
    try {
      await supabase
        .from('team_users')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error removing team assignment:', error);
    }
    
    removeUser(userId);
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "Gebruiker verwijderd",
      description: "De gebruiker is verwijderd",
    });
  };
  
  // Find team name by user id
  const getTeamName = (userId: number) => {
    const teamUser = teamUsers.find(tu => tu.user_id === userId);
    return teamUser ? teamUser.team_name : "-";
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Gebruikers</CardTitle>
              <CardDescription>
                Beheer de gebruikerstoegang tot het systeem
              </CardDescription>
            </div>
            
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus size={16} />
              Nieuwe gebruiker
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Gegevens laden...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gebruikersnaam</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    teamName={getTeamName(user.id)}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        onSave={handleSaveUser}
        teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
      />
    </div>
  );
};

export default UsersTabUpdated;
