
import React, { useState } from "react";
import { MOCK_USERS } from "@/components/auth/LoginForm"; // Import the mock users
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "@/components/auth/AuthProvider"; // Import the User type

// Define the mock users here to avoid circular imports
export const MOCK_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin" as const },
  { id: 2, username: "team1", password: "team123", role: "team" as const, teamId: 1 },
  { id: 3, username: "team2", password: "team123", role: "team" as const, teamId: 2 },
  { id: 4, username: "referee", password: "referee123", role: "referee" as const },
];

const UsersTab: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "team" as const,
    teamId: undefined as number | undefined
  });
  
  // Handle opening edit dialog
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      password: "",  // Don't show existing password for security
      role: user.role,
      teamId: user.teamId
    });
    setDialogOpen(true);
  };
  
  // Handle opening add dialog
  const handleAddNew = () => {
    setEditingUser(null);
    setNewUser({
      username: "",
      password: "",
      role: "team",
      teamId: undefined
    });
    setDialogOpen(true);
  };
  
  // Handle save user
  const handleSaveUser = () => {
    if (!newUser.username) {
      toast({
        title: "Gebruikersnaam ontbreekt",
        description: "Vul een gebruikersnaam in",
        variant: "destructive",
      });
      return;
    }
    
    if (!editingUser && !newUser.password) {
      toast({
        title: "Wachtwoord ontbreekt",
        description: "Vul een wachtwoord in",
        variant: "destructive",
      });
      return;
    }
    
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              username: newUser.username, 
              ...(newUser.password ? { password: newUser.password } : {}),
              role: newUser.role,
              ...(newUser.role === "team" ? { teamId: newUser.teamId } : {})
            } 
          : user
      ));
      
      toast({
        title: "Gebruiker bijgewerkt",
        description: `${newUser.username} is bijgewerkt`,
      });
    } else {
      // Add new user
      const newId = Math.max(...users.map(u => u.id), 0) + 1;
      
      const userToAdd: User = {
        id: newId,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        ...(newUser.role === "team" && newUser.teamId ? { teamId: newUser.teamId } : {})
      };
      
      setUsers([...users, userToAdd]);
      
      toast({
        title: "Gebruiker toegevoegd",
        description: `${newUser.username} is toegevoegd`,
      });
    }
    
    setDialogOpen(false);
  };
  
  // Handle delete user
  const handleDeleteUser = (userId: number) => {
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
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    {user.role === "admin" && "Administrator"}
                    {user.role === "team" && "Teamverantwoordelijke"}
                    {user.role === "referee" && "Scheidsrechter"}
                  </TableCell>
                  <TableCell>
                    {user.teamId ? `Team ${user.teamId}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/10"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Gebruiker bewerken" : "Nieuwe gebruiker toevoegen"}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Bewerk de gegevens van deze gebruiker" 
                : "Voeg een nieuwe gebruiker toe aan het systeem"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Gebruikersnaam</label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                placeholder="Gebruikersnaam"
              />
            </div>
            
            <div className="space-y-2">
              <label>Wachtwoord {editingUser && "(laat leeg om ongewijzigd te laten)"}</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Wachtwoord"
              />
            </div>
            
            <div className="space-y-2">
              <label>Rol</label>
              <Select
                value={newUser.role}
                onValueChange={(value: "admin" | "team" | "referee") => 
                  setNewUser({...newUser, role: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="team">Teamverantwoordelijke</SelectItem>
                  <SelectItem value="referee">Scheidsrechter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newUser.role === "team" && (
              <div className="space-y-2">
                <label>Team ID</label>
                <Input
                  type="number"
                  value={newUser.teamId?.toString() || ""}
                  onChange={(e) => setNewUser({
                    ...newUser, 
                    teamId: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Team ID"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;

