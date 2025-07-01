
import React, { useState } from "react";
import { Label } from "@shared/components/ui/label";
import { Input } from "@shared/components/ui/input";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (userData: any) => Promise<boolean>;
  isAdding: boolean;
}

const AddUserForm: React.FC<AddUserFormProps> = ({
  isOpen,
  onClose,
  onAddUser,
  isAdding,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "player_manager",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddUser(formData);
    if (success) {
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "player_manager",
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-purple-100 border-purple-light shadow-lg">
        <DialogHeader className="bg-purple-100">
          <DialogTitle className="text-2xl text-purple-light">Nieuwe gebruiker toevoegen</DialogTitle>
          <DialogDescription className="text-purple-dark">
            Vul de gegevens in voor de nieuwe gebruiker.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Gebruikersnaam</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="border-purple-light focus:border-purple-dark"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="border-purple-light focus:border-purple-dark"
            />
          </div>
          <div>
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="border-purple-light focus:border-purple-dark"
            />
          </div>
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="border-purple-light focus:border-purple-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Beheerder</SelectItem>
                <SelectItem value="player_manager">Teamverantwoordelijke</SelectItem>
                <SelectItem value="referee">Scheidsrechter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="bg-purple-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isAdding}
              className="border-purple-light text-purple-dark hover:bg-purple-light hover:text-white"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isAdding}
              className="bg-purple-light hover:bg-purple-dark text-white"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Toevoegen...
                </>
              ) : (
                "Toevoegen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserForm;

