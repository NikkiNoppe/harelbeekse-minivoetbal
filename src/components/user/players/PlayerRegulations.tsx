
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Calendar, Shield } from "lucide-react";

const PlayerRegulations: React.FC = () => {
  return (
    <Card className="mt-6 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Shield className="h-5 w-5" />
          Spelersreglement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-orange-700">
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Maximum aantal spelers:</strong> Per team kunnen maximaal 20 spelers worden ingeschreven.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Geen teamwijzigingen tijdens seizoen:</strong> Spelers kunnen tijdens het lopende seizoen niet van team veranderen.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Spelerskaarten:</strong> Alle spelers moeten beschikken over een geldige spelerskaart voordat ze mogen deelnemen aan wedstrijden.
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Leeftijdsgrens:</strong> Spelers moeten minimaal 16 jaar oud zijn om deel te nemen aan de competitie.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerRegulations;
