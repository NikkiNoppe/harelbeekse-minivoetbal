
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, Shield, Info } from "lucide-react";

const PlayerRegulations: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Spelersreglement
        </CardTitle>
        <CardDescription>
          Belangrijke regels en richtlijnen voor spelersbeheer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Maximum spelers:</strong> Elk team mag maximaal 20 spelers hebben per seizoen.
          </AlertDescription>
        </Alert>
        
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Teamwijzigingen:</strong> Spelers kunnen niet van team wisselen tijdens het lopende seizoen.
          </AlertDescription>
        </Alert>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Spelersgegevens:</strong> Alle spelers moeten een geldige geboortedatum hebben voor leeftijdsverificatie.
          </AlertDescription>
        </Alert>
        
        <div className="text-sm text-muted-foreground mt-4">
          <p>Voor vragen over het spelersreglement, neem contact op met de competitieleiding.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerRegulations;
