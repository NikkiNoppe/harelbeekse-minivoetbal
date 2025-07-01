
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";

interface MatchFormListProps {
  // No required props for now
}

const MatchFormList: React.FC<MatchFormListProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijdformulieren</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Geen wedstrijdformulieren gevonden.
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchFormList;
