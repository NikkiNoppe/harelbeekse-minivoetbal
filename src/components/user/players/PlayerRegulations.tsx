import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, Shield, Info } from "lucide-react";

const PlayerRegulations: React.FC = () => {
  return (
    <Card className="bg-white">
      <CardHeader className="bg-white">
        <CardTitle className="flex items-center gap-2 text-purple-dark">
          <Shield className="h-5 w-5" />
          Spelersreglement
        </CardTitle>
        <CardDescription className="text-purple-dark">
          Belangrijke regels en richtlijnen voor spelersbeheer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 bg-white">
        <Alert className="bg-white">
          <Users className="h-4 w-4 text-purple-dark" />
          <AlertDescription className="text-purple-dark">
            <strong className="text-purple-dark">Maximum spelers:</strong> Elk team mag maximaal 20 spelers hebben per seizoen.
            <p><strong className="text-purple-dark">Teamwijzigingen:</strong> Spelers kunnen niet van team wisselen tijdens het lopende seizoen.</p>
            <p><strong className="text-purple-dark">Spelersgegevens:</strong> Alle spelers moeten een geldige geboortedatum hebben voor leeftijdsverificatie.</p>
          </AlertDescription>
        </Alert>
        
        <div className="text-sm text-purple-dark mt-4">
          <p className="text-purple-dark">Voor vragen over het spelersreglement, neem contact op met de competitieleiding.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerRegulations;
