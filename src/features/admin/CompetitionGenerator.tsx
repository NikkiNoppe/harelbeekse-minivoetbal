
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import FormatSelectionTab from "./competition-generator/FormatSelectionTab";
import DatesSelectionTab from "./competition-generator/DatesSelectionTab";
import PreviewTab from "./competition-generator/PreviewTab";

const CompetitionGenerator: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiegenerator</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie met playoff systeem of beker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4">
            <p>Competitiegenerator inhoud komt hier</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionGenerator;
