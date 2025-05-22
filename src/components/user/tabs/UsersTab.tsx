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

const UsersTab: React.FC = () => {
  const { toast } = useToast();
  const { allUsers, updateUser, addUser, removeUser } = useAuth();
  const [users, setUsers] = useState<User[]>(allUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch teams from Supabase
  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (error) throw error;
        
        setTeams(data || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de teams.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchTeams();
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
  const handleSaveUser = (formData: any) => {
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
      
      toast({
        title: "Gebruiker toegevoegd",
        description: `${formData.username} is toegevoegd`,
      });
    }
  };
  
  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    removeUser(userId);
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "Gebruiker verwijderd",
      description: "De gebruiker is verwijderd",
    });
  };
  
  // Find team name by id
  const getTeamName = (teamId: number | undefined) => {
    if (!teamId) return "-";
    const team = teams.find(t => t.team_id === teamId);
    return team ? team.team_name : `Team ${teamId}`;
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
            <div className="py-8 text-center text-muted-foreground">Teams laden...</div>
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
                    teamName={getTeamName(user.teamId)}
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

export default UsersTab;
