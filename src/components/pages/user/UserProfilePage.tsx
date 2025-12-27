import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Shield, Users, Trophy, Award, Phone, 
  AlertCircle, MapPin, Palette, Calendar, Clock, ArrowRight
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpcomingMatches } from "@/hooks/useUpcomingMatches";
import { formatDateWithDay, formatTimeForDisplay } from "@/lib/dateUtils";
import MatchesCard from "@/components/pages/admin/matches/components/MatchesCard";

// Loading skeleton
const ProfileSkeleton = memo(() => (
  <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
    <PageHeader title="Profiel" />
    
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 sm:h-7 w-32 sm:w-48" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
));

// Error component
const ProfileError = memo(() => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Profiel" />
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Fout bij laden</h3>
            <p className="text-muted-foreground mb-6">
              Kon profielgegevens niet laden
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Terug
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Role badge component
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    admin: { label: "Administrator", variant: "default" },
    player_manager: { label: "Team Manager", variant: "secondary" },
    referee: { label: "Scheidsrechter", variant: "outline" },
  };

  const config = roleConfig[role.toLowerCase()] || { label: role, variant: "outline" as const };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};

// Team card component
const TeamCard: React.FC<{
  team: {
    team_id: number;
    team_name: string;
    club_colors?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
  };
}> = memo(({ team }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/teams`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md",
              team.club_colors ? "" : "bg-primary"
            )} style={team.club_colors ? { backgroundColor: team.club_colors } : {}}>
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{team.team_name}</CardTitle>
              {team.club_colors && (
                <div className="flex items-center gap-2 mt-1">
                  <Palette className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{team.club_colors}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {team.contact_person && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{team.contact_person}</span>
          </div>
        )}
        {team.contact_email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a 
              href={`mailto:${team.contact_email}`}
              className="text-primary hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {team.contact_email}
            </a>
          </div>
        )}
        {team.contact_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a 
              href={`tel:${team.contact_phone}`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {team.contact_phone}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TeamCard.displayName = 'TeamCard';

// Next Match Card Component - Wrapper with title
const NextMatchCard: React.FC<{
  match: {
    match_id: number;
    match_date: string;
    opponent_name: string;
    home_team_name?: string;
    away_team_name?: string;
    is_home: boolean;
    speeldag?: string;
    location?: string;
  };
  teamName: string;
}> = memo(({ match, teamName }) => {
  const navigate = useNavigate();
  
  // Determine home and away team names
  const homeTeam = match.is_home ? teamName : (match.opponent_name || match.away_team_name || '');
  const awayTeam = match.is_home ? (match.opponent_name || match.away_team_name || '') : teamName;
  
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Eerstvolgende Wedstrijd
        </h2>
      </div>
      
      <button
        onClick={() => navigate('/admin/match-forms')}
        className="border-none bg-transparent p-0 transition-all duration-200 text-left w-full group hover:shadow-none hover:border-none hover:bg-transparent cursor-pointer"
      >
        <MatchesCard
          id={undefined}
          home={homeTeam}
          away={awayTeam}
          homeScore={undefined}
          awayScore={undefined}
          date={formatDateWithDay(match.match_date)}
          time={formatTimeForDisplay(match.match_date)}
          location={match.location || '-'}
          status="upcoming"
          badgeSlot={
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold bg-primary text-white px-1.5 py-0.5 rounded">
                Aankomend
              </span>
            </span>
          }
        />
      </button>
    </div>
  );
});
NextMatchCard.displayName = 'NextMatchCard';

// Main profile page component
const UserProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { profileData, isLoading, error } = useUserProfile();
  const navigate = useNavigate();
  
  // Get first team for upcoming matches
  const firstTeam = profileData?.teams?.[0];
  const { data: upcomingMatches, isLoading: matchesLoading } = useUpcomingMatches(
    firstTeam?.team_id || null,
    1
  );
  const nextMatch = upcomingMatches?.[0];

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Only show error for real errors, not missing data
  // profileData should always exist now (fallback to auth user)
  if (error && !profileData) {
    return <ProfileError />;
  }

  // profileData should always be available now (has fallback)
  if (!profileData) {
    // This should not happen, but just in case
    return <ProfileSkeleton />;
  }

  const { user, teams } = profileData;

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6">
      <PageHeader title="Mijn Profiel" />

      {/* Mobile-first layout: Stack cards vertically on mobile */}
      <div className="space-y-4 sm:space-y-6">
        {/* User Info Card - Full width on mobile */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 truncate">
                  {user.username}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleBadge role={user.role} />
                  {teams.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {user.email ? (
              <div className="flex items-center gap-2 sm:gap-3 text-sm">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <a 
                  href={`mailto:${user.email}`}
                  className="text-primary hover:underline truncate"
                >
                  {user.email}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 text-sm">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground italic">Geen e-mailadres beschikbaar</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Match Card - Show if user has a team and there's an upcoming match */}
        {firstTeam && !matchesLoading && nextMatch && (
          <NextMatchCard match={nextMatch} teamName={firstTeam.team_name} />
        )}

        {/* Teams Section */}
        {teams.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Mijn Teams
              </h2>
              <Badge variant="outline" className="text-xs">{teams.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {teams.map((team) => (
                <TeamCard key={team.team_id} team={team} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Mijn Teams
              </h2>
            </div>
            <Card>
              <CardContent className="p-4 sm:p-6 sm:p-8">
                <div className="text-center py-2 sm:py-3">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-foreground">Geen Teams</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Je bent momenteel niet gekoppeld aan een team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {user.role === 'player_manager' && (
              <Button
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
                onClick={() => navigate('/admin/players')}
              >
                <Users className="h-4 w-4 mr-2" />
                Spelers Beheren
              </Button>
            )}
            {user.role === 'admin' && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm sm:text-base"
                  onClick={() => navigate('/admin/users')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Gebruikers Beheren
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm sm:text-base"
                  onClick={() => navigate('/admin/settings')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Instellingen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(UserProfilePage);

