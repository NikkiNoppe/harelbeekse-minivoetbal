
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { Match } from "@features/matches/match/types";
import { EditMatchTabContent } from "@features/matches/match/EditMatchTabContent";
import { PastMatchesTabContent } from "@features/matches/match/PastMatchesTabContent";
import { matchService } from "@features/matches/match/matchService";

const MatchTab: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const matchesData = await matchService.getAllMatches();
        setMatches(matchesData);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>Wedstrijden</CardTitle>
        </CardHeader>
        <CardContent>Loading matches...</CardContent>
      </Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList>
            <TabsTrigger value="edit" className="focus:shadow-none">
              <Calendar className="mr-2 h-4 w-4" />
              Aanpassen
            </TabsTrigger>
            <TabsTrigger value="past" className="focus:shadow-none">
              <Clock className="mr-2 h-4 w-4" />
              Afgelopen wedstrijden
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-6">
            <EditMatchTabContent />
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            <PastMatchesTabContent matches={matches} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchTab;
