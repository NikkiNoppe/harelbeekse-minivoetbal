
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Calendar, Shield, Info } from "lucide-react";

const PlayerRegulations: React.FC = () => {
  return (
    <Card className="bg-white">
      <CardHeader className="bg-white">
        <CardTitle className="flex items-center gap-2 text-brand-dark">
          <Shield className="h-5 w-5" />
          Spelersreglement
        </CardTitle>
        <CardDescription className="text-brand-dark">
          Belangrijke regels en richtlijnen voor spelersbeheer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 bg-white p-6">
        <Alert className="bg-white p-6">
          <Users className="h-4 w-4 text-brand-dark" />
          <AlertDescription className="text-brand-dark space-y-3 ml-6">
            <p className="leading-relaxed"><strong className="text-brand-dark">Maximum spelers:</strong> Elk team mag maximaal 20 spelers hebben per seizoen.</p>
            <p className="leading-relaxed"><strong className="text-brand-dark">Teamwijzigingen:</strong> Spelers kunnen niet van team wisselen tijdens het lopende seizoen.</p>
            <p className="leading-relaxed"><strong className="text-brand-dark">Inschrijving:</strong> Je kan spelers inschrijven tot en met 31 augustus.</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PlayerRegulations;
