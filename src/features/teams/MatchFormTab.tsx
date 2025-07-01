
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { toast } from "@shared/hooks/use-toast";
import { User } from "@shared/types/auth";
import CompactMatchForm from "./match-form/CompactMatchForm";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";

interface MatchFormTabProps {
  teamId: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const handleMatchFormSubmit = (formData: any) => {
    console.log("Match form submitted:", formData);
    toast({
      title: "Match form submitted successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijdformulieren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MatchFormFilter 
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />
            <MatchFormList />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchFormTab;
