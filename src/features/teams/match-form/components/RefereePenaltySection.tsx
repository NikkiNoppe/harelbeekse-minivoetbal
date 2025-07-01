
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";

interface RefereePenaltySectionProps {
  canEdit: boolean;
}

export const RefereePenaltySection: React.FC<RefereePenaltySectionProps> = ({
  canEdit
}) => {
  return (
    <Card className="border-2" style={{ borderColor: "var(--purple-200)" }}>
      <CardHeader style={{ background: "var(--main-color-dark)" }} className="rounded-t-lg">
        <CardTitle className="text-base text-white">Sancties</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-center py-4 text-muted-foreground">
          Geen sancties toegevoegd.
        </div>
        {canEdit && (
          <Button variant="outline" className="w-full">
            Sanctie Toevoegen
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
