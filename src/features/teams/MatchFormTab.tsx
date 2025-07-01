
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { toast } from "@shared/hooks/use-toast";
import { User } from "@shared/types/auth";
import CompactMatchForm from "./match-form/CompactMatchForm";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";

interface MatchFormTabProps {
  user: User | null;
  teamId: number;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ user, teamId }) => {
  const handleMatchFormSubmit = (formData: any) => {
    console.log("Match form submitted:", formData);
    toast({
      title: "Match form submitted successfully",
    });
  };

  const handleFilterChange = (filters: any) => {
    console.log("Filters changed:", filters);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijdformulieren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MatchFormFilter onFilterChange={handleFilterChange} />
            <MatchFormList 
              matches={[]}
              onMatchSelect={(match) => console.log("Match selected:", match)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchFormTab;
