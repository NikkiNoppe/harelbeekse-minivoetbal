import React, { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Trash2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";

interface PlayerSelectionFormProps {
  teamId: number | undefined;
  onClose: () => void;
  onPlayerAdded: () => void;
}

export const PlayerSelectionForm: React.FC<PlayerSelectionFormProps> = ({ teamId, onClose, onPlayerAdded }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPlayer = async () => {
    setIsAdding(true);
    try {
      const response = await fetch('/api/addPlayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: teamId,
          firstName: firstName,
          lastName: lastName,
          birthDate: birthDate,
        }),
      });

      if (response.ok) {
        console.log('Player added successfully');
        onPlayerAdded();
        onClose();
      } else {
        console.error('Failed to add player');
      }
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwe speler toevoegen</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="firstName">Voornaam</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Voornaam"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Achternaam</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Achternaam"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="birthDate">Geboortedatum</Label>
          <Input
            type="date"
            id="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <Button onClick={handleAddPlayer} disabled={isAdding}>
          {isAdding ? "Toevoegen..." : "Speler toevoegen"}
        </Button>
      </CardContent>
    </Card>
  );
};
