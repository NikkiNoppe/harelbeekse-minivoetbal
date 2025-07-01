import React, { useState, useEffect } from "react";
import { toast } from "@shared/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { AuthProvider } from "@features/auth/AuthProvider";
import { CompactMatchForm } from "./match-form/CompactMatchForm";
import { MatchFormFilter } from "./match-form/MatchFormFilter";
import { MatchFormList } from "./match-form/MatchFormList";
import { supabase } from "@shared/integrations/supabase/client";

interface MatchFormTabProps {
  teamId: string;
}

export const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order('match_date', { ascending: false });

        if (error) {
          console.error("Error fetching matches:", error);
          toast({
            title: "Error",
            description: "Failed to fetch matches. Please try again.",
            variant: "destructive",
          });
        }

        setMatches(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [teamId]);

  const filteredMatches = matches.filter(match => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearchTerm =
      match.unique_number?.toLowerCase().includes(searchTermLower) ||
      match.location?.toLowerCase().includes(searchTermLower);

    const matchesDateFilter = !dateFilter || match.match_date.includes(dateFilter);

    return matchesSearchTerm && matchesDateFilter;
  });

  return (
    <AuthProvider>
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijden</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchFormFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
          />
          <MatchFormList
            teamId={teamId}
            matches={filteredMatches}
            loading={loading}
          />
        </CardContent>
      </Card>
    </AuthProvider>
  );
};
