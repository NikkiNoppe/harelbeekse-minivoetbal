
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

const LoginForm: React.FC = () => {
  const { toast } = useToast();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Inlogfout",
        description: "Vul gebruikersnaam en wachtwoord in.",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(username, password);
      toast({
        title: "Ingelogd",
        description: `Welkom, ${username}!`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Inlogfout",
        description: error.message || "Ongeldige gebruikersnaam of wachtwoord.",
        variant: "destructive",
      });
    }
  };

  // Mock data for demo 
  const demoUsers = [
    { id: 1, name: "Admin", role: "admin", username: "admin", password: "password" },
    { id: 2, name: "Team 1", role: "player_manager", username: "team1", password: "password" },
    { id: 3, name: "Team 2", role: "player_manager", username: "team2", password: "password" },
    { id: 4, name: "Referee", role: "referee", username: "ref", password: "password" },
  ];

  return (
    <div className="w-full flex justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Inloggen</CardTitle>
          <CardDescription>
            Voer uw gebruikersnaam en wachtwoord in om verder te gaan
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Gebruikersnaam</Label>
            <Input
              id="username"
              placeholder="Gebruikersnaam"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              placeholder="Wachtwoord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit}>Inloggen</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
