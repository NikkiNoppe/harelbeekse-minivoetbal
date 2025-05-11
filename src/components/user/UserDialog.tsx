
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/components/auth/AuthProvider";

interface UserFormData {
  username: string;
  password: string;
  role: "admin" | "team" | "referee";
  teamId: number | undefined;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  onSave: (userData: UserFormData, editingUser: User | null) => void;
}

const UserDialog: React.FC<UserDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingUser, 
  onSave 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    role: "team",
    teamId: undefined
  });

  // Reset form data when dialog opens with different user
  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: "", // Don't show existing password for security
        role: editingUser.role,
        teamId: editingUser.teamId
      });
    } else {
      setFormData({
        username: "",
        password: "",
        role: "team",
        teamId: undefined
      });
    }
  }, [editingUser, open]);

  const handleSave = () => {
    if (!formData.username) {
      toast({
        title: "Gebruikersnaam ontbreekt",
        description: "Vul een gebruikersnaam in",
        variant: "destructive",
      });
      return;
    }
    
    if (!editingUser && !formData.password) {
      toast({
        title: "Wachtwoord ontbreekt",
        description: "Vul een wachtwoord in",
        variant: "destructive",
      });
      return;
    }

    onSave(formData, editingUser);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Gebruikersnaam"
            />
          </div>
          
          <div className="space-y-2">
            <label>Wachtwoord {editingUser && "(laat leeg om ongewijzigd te laten)"}</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Wachtwoord"
            />
          </div>
          
          <div className="space-y-2">
            <label>Rol</label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "team" | "referee") => 
                setFormData({...formData, role: value})
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
          
          {formData.role === "team" && (
            <div className="space-y-2">
              <label>Team ID</label>
              <Input
                type="number"
                value={formData.teamId?.toString() || ""}
                onChange={(e) => setFormData({
                  ...formData, 
                  teamId: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Team ID"
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave}>
            {editingUser ? "Bijwerken" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
