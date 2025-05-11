
import React, { useState } from "react";
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
import { User, Mail, UserPlus } from "lucide-react";
import { MOCK_TEAMS } from "@/components/Layout";

interface NewUserData {
  name: string;
  email: string;
  role: "admin" | "team" | "referee";
  teamId: number | null;
}

interface PendingUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "team" | "referee";
  teamId: number | null;
  inviteSent: string;
  status: "pending" | "activated";
}

// Initial mock pending users
const initialPendingUsers: PendingUser[] = [
  {
    id: 1,
    name: "Jan Janssens",
    email: "jan.janssens@example.com",
    role: "team",
    teamId: 3,
    inviteSent: "2025-05-01",
    status: "activated"
  },
  {
    id: 2,
    name: "Piet Pieters",
    email: "piet.pieters@example.com",
    role: "referee",
    teamId: null,
    inviteSent: "2025-05-05",
    status: "pending"
  }
];

const UserManagementTab: React.FC = () => {
  const { toast } = useToast();
  
  const [newUser, setNewUser] = useState<NewUserData>({
    name: "",
    email: "",
    role: "team",
    teamId: null
  });
  
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(initialPendingUsers);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const handleAddUser = () => {
    // Validate form
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Fout",
        description: "Naam en e-mail zijn verplicht",
        variant: "destructive"
      });
      return;
    }
    
    if (newUser.role === "team" && !newUser.teamId) {
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
    
    // Create new pending user
    const today = new Date().toISOString().split('T')[0];
    const newId = Math.max(0, ...pendingUsers.map(u => u.id)) + 1;
    
    const pendingUser: PendingUser = {
      id: newId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      teamId: newUser.teamId,
      inviteSent: today,
      status: "pending"
    };
    
    setPendingUsers(prev => [...prev, pendingUser]);
    
    // Send email (mock)
    toast({
      title: "Uitnodiging verzonden",
      description: `Er is een e-mail verzonden naar ${newUser.email} met instructies om een account aan te maken.`
    });
    
    // Reset form
    setNewUser({
      name: "",
      email: "",
      role: "team",
      teamId: null
    });
  };
  
  const handleResendInvitation = (user: PendingUser) => {
    // Update the invitation sent date
    setPendingUsers(prev => 
      prev.map(u => 
        u.id === user.id 
          ? { ...u, inviteSent: new Date().toISOString().split('T')[0] }
          : u
      )
    );
    
    toast({
      title: "Uitnodiging opnieuw verzonden",
      description: `Er is opnieuw een e-mail verzonden naar ${user.email}.`
    });
  };
  
  const handleOpenDeleteConfirmation = (userId: number) => {
    setSelectedUserId(userId);
    setConfirmDialogOpen(true);
  };
  
  const handleDeleteUser = () => {
    if (selectedUserId === null) return;
    
    setPendingUsers(prev => prev.filter(user => user.id !== selectedUserId));
    
    toast({
      title: "Gebruiker verwijderd",
      description: "De gebruiker is succesvol verwijderd"
    });
    
    setConfirmDialogOpen(false);
    setSelectedUserId(null);
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
              <h3 className="text-lg font-medium">Nieuwe gebruiker uitnodigen</h3>
              
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
                    onValueChange={(value: "admin" | "team" | "referee") => {
                      setNewUser({
                        ...newUser, 
                        role: value,
                        // Reset teamId if role is not team
                        teamId: value === "team" ? newUser.teamId : null
                      });
                    }}
                  >
                    <SelectTrigger id="role">
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
              
              <Button 
                onClick={handleAddUser}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Uitnodiging verzenden
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="mb-4 text-lg font-medium">Uitgenodigde gebruikers</h3>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Uitgenodigd op</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          Geen uitgenodigde gebruikers
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.role === "admin" && "Administrator"}
                            {user.role === "team" && "Teamverantwoordelijke"}
                            {user.role === "referee" && "Scheidsrechter"}
                          </TableCell>
                          <TableCell>
                            {user.teamId 
                              ? MOCK_TEAMS.find(t => t.id === user.teamId)?.name || `Team ${user.teamId}` 
                              : "-"
                            }
                          </TableCell>
                          <TableCell>{user.inviteSent}</TableCell>
                          <TableCell>
                            {user.status === "pending" ? (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                In afwachting
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Geactiveerd
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {user.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvitation(user)}
                                className="h-8 w-8 p-0"
                              >
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Opnieuw versturen</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteConfirmation(user.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            >
                              <User className="h-4 w-4" />
                              <span className="sr-only">Verwijderen</span>
                            </Button>
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
    </div>
  );
};

export default UserManagementTab;
