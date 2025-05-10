
import React, { useState } from "react";
import { MOCK_TEAMS } from "@/components/Layout";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Shield, ClipboardCheck, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Mock users for demonstration
const initialUsers = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "team1", password: "team123", role: "team", teamId: 1 },
  { id: 3, username: "team2", password: "team123", role: "team", teamId: 2 },
  { id: 4, username: "referee", password: "referee123", role: "referee" },
];

interface User {
  id: number;
  username: string;
  password: string;
  role: "admin" | "team" | "referee";
  teamId?: number;
}

const UsersTab: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<{
    username: string, 
    password: string,
    role: "admin" | "team" | "referee",
    teamId?: number
  }>({
    username: "", 
    password: "",
    role: "team",
  });
  
  // Handle opening add dialog
  const handleAddNew = () => {
    setNewUser({username: "", password: "", role: "team"});
    setDialogOpen(true);
  };
  
  // Handle role change
  const handleRoleChange = (role: "admin" | "team" | "referee") => {
    if (role !== "team") {
      setNewUser({...newUser, role, teamId: undefined});
    } else {
      setNewUser({...newUser, role});
    }
  };
  
  // Handle save user
  const handleSaveUser = () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul gebruikersnaam en wachtwoord in",
        variant: "destructive",
      });
      return;
    }
    
    if (newUser.role === "team" && !newUser.teamId) {
      toast({
        title: "Team ontbreekt",
        description: "Selecteer een team voor de gebruiker",
        variant: "destructive",
      });
      return;
    }
    
    // Check if username already exists
    if (users.some(u => u.username === newUser.username)) {
      toast({
        title: "Gebruikersnaam bestaat al",
        description: "Kies een andere gebruikersnaam",
        variant: "destructive",
      });
      return;
    }
    
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    
    const userToAdd: User = {
      id: newId,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      ...(newUser.role === "team" && {teamId: newUser.teamId}),
    };
    
    setUsers([...users, userToAdd]);
    setDialogOpen(false);
    
    toast({
      title: "Gebruiker toegevoegd",
      description: `${newUser.username} is toegevoegd als ${getRoleName(newUser.role)}`,
    });
  };
  
  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    // Prevent deleting the last admin
    const adminsCount = users.filter(u => u.role === "admin").length;
    const userToDelete = users.find(u => u.id === userId);
    
    if (userToDelete?.role === "admin" && adminsCount <= 1) {
      toast({
        title: "Kan niet verwijderen",
        description: "Er moet minstens één admin zijn",
        variant: "destructive",
      });
      return;
    }
    
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "Gebruiker verwijderd",
      description: "De gebruiker is verwijderd",
    });
  };
  
  // Helper to get role name in Dutch
  const getRoleName = (role: string) => {
    switch (role) {
      case "admin": return "Administrator";
      case "team": return "Spelersverantwoordelijke";
      case "referee": return "Scheidsrechter";
      default: return role;
    }
  };
  
  // Helper to get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "team": return <Users className="h-4 w-4" />;
      case "referee": return <ClipboardCheck className="h-4 w-4" />;
      default: return null;
    }
  };
  
  // Helper to get role badge
  const getRoleBadge = (role: string) => {
    let color = "";
    switch (role) {
      case "admin": 
        color = "bg-purple-500/20 hover:bg-purple-500/30 text-purple-500";
        break;
      case "team": 
        color = "bg-blue-500/20 hover:bg-blue-500/30 text-blue-500";
        break;
      case "referee": 
        color = "bg-orange-500/20 hover:bg-orange-500/30 text-orange-500";
        break;
      default: color = "";
    }
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {getRoleIcon(role)}
        <span>{getRoleName(role)}</span>
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Gebruikers</CardTitle>
              <CardDescription>
                Beheer gebruikers en hun rollen
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
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.teamId ? (
                      MOCK_TEAMS.find(t => t.id === user.teamId)?.name || "Onbekend team"
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                    >
                      <Trash2 size={16} />
                    </Button>
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
            <DialogTitle>Nieuwe gebruiker toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe gebruiker toe aan het systeem
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
              <label>Wachtwoord</label>
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
                onValueChange={(value) => handleRoleChange(value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecteer een rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="team">Spelersverantwoordelijke</SelectItem>
                  <SelectItem value="referee">Scheidsrechter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newUser.role === "team" && (
              <div className="space-y-2">
                <label>Team</label>
                <Select 
                  value={newUser.teamId?.toString()} 
                  onValueChange={(value) => setNewUser({...newUser, teamId: parseInt(value)})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecteer een team" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEAMS.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveUser}>
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;
