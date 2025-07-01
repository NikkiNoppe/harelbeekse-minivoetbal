
import React, { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { Plus } from "lucide-react";
import { User } from "@shared/types/auth";
import UserRow from "../UserRow";
import UserDialog from "../UserDialog";
import { useUsersData } from "./hooks/useUsersData";

const UsersTabUpdated: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const {
    users,
    teams,
    loading,
    handleSaveUser,
    handleDeleteUser,
    getTeamName
  } = useUsersData();
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };
  
  const onSaveUser = async (formData: any): Promise<boolean> => {
    const success = await handleSaveUser(formData, editingUser);
    if (success) {
      setDialogOpen(false);
    }
    return success;
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
        onSave={onSaveUser}
        teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
      />
    </div>
  );
};

export default UsersTabUpdated;
