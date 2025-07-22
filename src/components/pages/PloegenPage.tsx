import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone, Mail, Palette, Shield, MapPin } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { TeamCardSkeleton } from "@/components/ui/skeleton";

const TeamsPage: React.FC = () => {
  const { data: teams, isLoading, error, refetch } = useTeams();

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="team-skeleton">
      {[...Array(6)].map((_, i) => (
        <TeamCardSkeleton key={i} />
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
        <p className="text-sm text-red-500 mb-4">{error?.message || 'Er is een fout opgetreden bij het laden van teams'}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Opnieuw proberen
        </button>
      </CardContent>
    </Card>
  );

  // Mapping van kleur-omschrijving naar Tailwind utility classes
  const colorClassMap: Record<string, string> = {
    'lichtblauw': 'bg-sky-100 border-sky-200 text-sky-700',
    'blauw': 'bg-blue-100 border-blue-200 text-blue-700',
    'muntgroen': 'bg-green-100 border-green-200 text-green-700',
    'groen': 'bg-green-100 border-green-200 text-green-700',
    'rood': 'bg-red-100 border-red-200 text-red-700',
    'geel': 'bg-yellow-100 border-yellow-200 text-yellow-700',
    'paars': 'bg-purple-100 border-purple-200 text-purple-700',
    'oranje': 'bg-orange-100 border-orange-200 text-orange-700',
    'zwart': 'bg-gray-800 border-gray-900 text-white',
    'wit': 'bg-gray-100 border-gray-200 text-gray-700',
    // Voeg meer mappings toe indien nodig
  };

  function getBadgeColorClass(clubColor: string) {
    if (!clubColor) return 'bg-gray-100 border-gray-200 text-gray-700';
    // Zoek op basis van volledige string of deelstring
    const key = clubColor.trim().toLowerCase();
    // Exacte match
    if (colorClassMap[key]) return colorClassMap[key];
    // Zoek op basis van deelstring
    for (const k in colorClassMap) {
      if (key.includes(k)) return colorClassMap[k];
    }
    return 'bg-gray-100 border-gray-200 text-gray-700';
  }

  const TeamCard = React.memo(({ team }: { team: any }) => {
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
                <Badge variant="outline" className={`text-xs ${getBadgeColorClass(team.club_colors)}`}>
                  <Palette className="h-3 w-3 mr-1" />
                  {team.club_colors}
                </Badge>
              )}
            </div>

            {/* Contact Information - always show icons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
                {team.contact_person ? (
                  <span className="truncate">{team.contact_person}</span>
                ) : (
                  <span className="truncate text-gray-400"> </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                {team.contact_phone ? (
                  <span>{team.contact_phone}</span>
                ) : (
                  <span className="text-gray-400"> </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                {team.contact_email ? (
                  <span className="truncate">{team.contact_email}</span>
                ) : (
                  <span className="truncate text-gray-400"> </span>
                )}
              </div>
            </div>
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

  if (isLoading) {
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
        {!teams || teams.length === 0 ? (
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

export default TeamsPage; 