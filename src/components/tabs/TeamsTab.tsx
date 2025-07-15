import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone, Mail, Palette, Shield, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  team_id: number;
  team_name: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  club_colors: string | null;
}

const TeamsTab: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeams = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors')
        .order('team_name');

      if (error) {
        console.error('Error fetching teams:', error);
        setError('Fout bij het laden van teams');
        return;
      }

      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Fout bij het laden van teams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleRefresh = () => {
    fetchTeams(true);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ErrorState = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <h3 className="font-semibold">Fout bij laden</h3>
        </div>
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Opnieuw proberen
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const TeamCard = React.memo(({ team }: { team: Team }) => {
    const hasContactInfo = team.contact_person || team.contact_phone || team.contact_email;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 bg-gradient-to-r from-white to-purple-50 hover:border-l-purple-600">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Team Name Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
                  {team.team_name}
                </h3>
              </div>
              {team.club_colors && (
                <Badge variant="outline" className="text-xs bg-purple-100 border-purple-200 text-purple-700">
                  <Palette className="h-3 w-3 mr-1" />
                  {team.club_colors}
                </Badge>
              )}
            </div>

            {/* Contact Information */}
            {hasContactInfo ? (
              <div className="space-y-2">
                {team.contact_person && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">{team.contact_person}</span>
                  </div>
                )}
                
                {team.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{team.contact_phone}</span>
                  </div>
                )}
                
                {team.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{team.contact_email}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>Geen contactgegevens beschikbaar</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  TeamCard.displayName = 'TeamCard';

  const Header = () => (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Shield className="h-6 w-6 text-purple-600" />
        Teams
      </h2>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      
      <section>
        {teams.length === 0 ? (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Geen teams gevonden</h3>
              <p className="text-purple-600">Er zijn momenteel geen teams geregistreerd.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.team_id} team={team} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeamsTab; 