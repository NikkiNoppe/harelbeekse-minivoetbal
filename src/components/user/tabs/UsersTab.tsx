
import React, { useState } from "react";
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
import { User } from "@/components/auth/AuthProvider";
import UserRow from "@/components/user/UserRow";
import UserDialog from "@/components/user/UserDialog";

const UsersTab: React.FC = () => {
  const { toast } = useToast();
  const { allUsers, updateUser, addUser, removeUser } = useAuth();
  const [users, setUsers] = useState<User[]>(allUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
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
  const handleSaveUser = (formData: any, currentEditingUser: User | null) => {
    if (currentEditingUser) {
      // Update existing user
      const updatedUser: User = {
        ...currentEditingUser,
        username: formData.username,
        ...(formData.password ? { password: formData.password } : {}),
        role: formData.role,
        ...(formData.role === "team" ? { teamId: formData.teamId } : {})
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
        ...(formData.role === "team" && formData.teamId ? { teamId: formData.teamId } : {})
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
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UsersTab;
