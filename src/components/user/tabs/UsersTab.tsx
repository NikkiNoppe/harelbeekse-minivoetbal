
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
import { useDeleteUser } from "@/components/admin/user-management/operations/useDeleteUser";
import ConfirmDeleteDialog from "@/components/admin/user-management/ConfirmDeleteDialog";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  team_id: number;
  team_name: string;
}

interface DbUser {
  user_id: number;
  username: string;
  email: string;
  role: string;
  teams?: { team_id: number; team_name: string }[];
}

const UsersTab: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Fetch users and teams from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching users and teams data...');
      
      // Fetch users with their team relationships
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          email,
          role,
          team_users!left (
            team_id,
            teams!inner (
              team_id,
              team_name
            )
          )
        `)
        .order('username');

      if (usersError) throw usersError;

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (teamsError) throw teamsError;
      
      setTeams(teamsData || []);

      // Transform users data
      const transformedUsers: User[] = (usersData || []).map(user => {
        const teamUsers = user.team_users || [];
        const userTeams = teamUsers.map(tu => ({
          team_id: tu.teams.team_id,
          team_name: tu.teams.team_name
        }));
        
        const transformedUser = {
          id: user.user_id,
          username: user.username,
          email: user.email || '',
          password: '',
          role: user.role as any,
          teamId: userTeams.length > 0 ? userTeams[0].team_id : undefined
        };
        
        console.log('👤 Transformed user:', {
          original_user_id: user.user_id,
          mapped_id: transformedUser.id,
          username: transformedUser.username
        });
        
        return transformedUser;
      });

      console.log('✅ Successfully fetched and transformed users:', transformedUsers.length);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de gegevens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize delete user hook
  const { deleteUser } = useDeleteUser(fetchData);

  useEffect(() => {
    fetchData();
  }, []);
  
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
  const handleSaveUser = async (formData: any): Promise<boolean> => {
    try {
      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase.rpc('update_user_password', {
          user_id_param: editingUser.id,
          new_password: formData.password
        });

        if (updateError) throw updateError;

        // Update other user fields
        const { error: userError } = await supabase
          .from('users')
          .update({
            username: formData.username,
            role: formData.role,
            email: formData.email || null
          })
          .eq('user_id', editingUser.id);

        if (userError) throw userError;

        // Update team assignment if role is player_manager
        if (formData.role === "player_manager" && formData.teamId) {
          // Remove existing team assignment
          await supabase
            .from('team_users')
            .delete()
            .eq('user_id', editingUser.id);
          
          // Add new team assignment
          await supabase
            .from('team_users')
            .insert({
              user_id: editingUser.id,
              team_id: formData.teamId
            });
        }
        
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt`,
        });
      } else {
        // Add new user
        const { data: newUser, error: createError } = await supabase.rpc('create_user_with_hashed_password', {
          username_param: formData.username,
          email_param: formData.email || null,
          password_param: formData.password,
          role_param: formData.role
        });

        if (createError) throw createError;

        // Add team assignment if role is player_manager
        if (formData.role === "player_manager" && formData.teamId && newUser) {
          await supabase
            .from('team_users')
            .insert({
              user_id: newUser.user_id,
              team_id: formData.teamId
            });
        }
        
        toast({
          title: "Gebruiker toegevoegd",
          description: `${formData.username} is toegevoegd`,
        });
      }
      
      // Refresh data
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de gebruiker",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Handle opening delete confirmation
  const handleOpenDeleteConfirmation = (userId: number) => {
    console.log('🗑️ Opening delete confirmation for user ID:', userId);
    
    const userToDeleteInfo = users.find(user => user.id === userId);
    console.log('👤 User details for deletion:', {
      id: userId,
      username: userToDeleteInfo?.username,
      found: !!userToDeleteInfo
    });
    
    setUserToDelete(userId);
    setConfirmDialogOpen(true);
  };

  // Handle delete user confirmation
  const handleConfirmDelete = async () => {
    if (userToDelete) {
      console.log('🚀 Starting deletion process for user ID:', userToDelete);
      
      const userInfo = users.find(user => user.id === userToDelete);
      console.log('👤 Deleting user:', {
        id: userToDelete,
        username: userInfo?.username
      });
      
      setDeleting(true);
      const success = await deleteUser(userToDelete);
      setDeleting(false);
      
      if (success) {
        console.log('✅ User deletion successful, closing dialogs');
        setConfirmDialogOpen(false);
        setUserToDelete(null);
        
        const remainingUsers = users.filter(user => user.id !== userToDelete);
        console.log('📊 Users remaining after deletion:', remainingUsers.length);
      } else {
        console.log('❌ User deletion failed');
      }
    } else {
      console.log('⚠️ No user selected for deletion');
    }
  };
  
  // Find team name by user id
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
                {users.map(user => {
                  console.log('🔍 Rendering user row:', {
                    id: user.id,
                    username: user.username
                  });
                  
                  return (
                    <UserRow
                      key={user.id}
                      user={user}
                      teamName={getTeamName(user.teamId)}
                      onEdit={handleEditUser}
                      onDelete={handleOpenDeleteConfirmation}
                    />
                  );
                })}
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

      <ConfirmDeleteDialog 
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={deleting}
      />
    </div>
  );
};

export default UsersTab;
