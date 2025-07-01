import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Calendar, Users, Trophy, MapPin, Clock, Star, Mail, Phone, ExternalLink, CalendarDays, User, Tag } from "lucide-react";
import { useBlogs } from "@shared/hooks/useBlogs";
import { supabase } from "@shared/integrations/supabase/client";
import { useState, useEffect } from "react";

interface CompetitionStats {
  total_teams: number;
  total_players: number;
  total_matches: number;
  current_season: string;
}

const AlgemeenTab = () => {
  const { blogs, loading: blogsLoading, error: blogsError } = useBlogs(4);
  const [stats, setStats] = useState<CompetitionStats>({
    total_teams: 0,
    total_players: 0,
    total_matches: 0,
    current_season: "2024-2025"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch teams count
        const { count: teamsCount } = await supabase
          .from('teams')
          .select('*', { count: 'exact', head: true });

        // Fetch players count
        const { count: playersCount } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true });

        // Fetch matches count
        const { count: matchesCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true });

        setStats({
          total_teams: teamsCount || 0,
          total_players: playersCount || 0,
          total_matches: matchesCount || 0,
          current_season: "2024-2025"
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 dag geleden";
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 'en' : ''} geleden`;
    return date.toLocaleDateString('nl-BE');
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
                <Trophy className="w-4 h-4 mr-2" />
                Seizoen {stats.current_season}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Harelbeekse Minivoetbal
              </h1>
              <p className="text-xl text-purple-100 max-w-2xl leading-relaxed">
                Welkom bij de meest competitieve en gezellige minivoetbalcompetitie van Harelbeke. 
                Doe mee en ervaar de spanning van echte teamspirit!
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button 
                size="lg" 
                className="bg-white text-purple-800 hover:bg-purple-50 font-semibold px-8 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <Users className="w-5 h-5 mr-2" />
                Inschrijven
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Teams</p>
                <p className="text-3xl font-bold text-purple-800">
                  {loading ? "..." : stats.total_teams}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Spelers</p>
                <p className="text-3xl font-bold text-purple-800">
                  {loading ? "..." : stats.total_players}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Wedstrijden</p>
                <p className="text-3xl font-bold text-purple-800">
                  {loading ? "..." : stats.total_matches}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Seizoen</p>
                <p className="text-3xl font-bold text-purple-800">
                  {stats.current_season}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <CalendarDays className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Info Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-shadow duration-200 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-purple-800">Speeldata</CardTitle>
                <CardDescription>Wekelijkse wedstrijden</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Elke donderdagavond van 19:00 tot 22:00 spelen we spannende wedstrijden 
              in een professionele setting.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-purple-800">Locatie</CardTitle>
                <CardDescription>Moderne sportfaciliteiten</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Sporthal De Krekel, uitgerust met professionele kunststofvelden 
              en alle benodigde faciliteiten.
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-purple-800">Teams</CardTitle>
                <CardDescription>Verschillende niveaus</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Van recreatief tot competitief - er is een plaats voor elke speler 
              ongeacht je niveau of ervaring.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Blog Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-purple-800">Laatste Nieuws</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Star className="w-4 h-4 mr-1" />
            Live
          </Badge>
        </div>
        
        {blogsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : blogsError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Er is een fout opgetreden bij het laden van de blogs.</p>
            </CardContent>
          </Card>
        ) : blogs.length === 0 ? (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6 text-center">
              <p className="text-purple-600">Nog geen blogs beschikbaar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <Card key={blog.id} className="hover:shadow-lg transition-shadow duration-200 border-purple-200 group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-600 text-white">
                      {blog.category || "Nieuws"}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(blog.published_at)}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-purple-800 mt-3 group-hover:text-purple-600 transition-colors">
                    {blog.title}
                  </CardTitle>
                  {blog.author && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <User className="w-4 h-4 mr-1" />
                      {blog.author}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {blog.excerpt || blog.content.substring(0, 150)}...
                  </p>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="group-hover:bg-purple-50">
                    Lees meer
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Contact Cards */}
      <section>
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Contact & Info</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Mail className="w-5 h-5 mr-2" />
                Email Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">Voor vragen over inschrijvingen:</p>
              <a href="mailto:info@harelbeekseminivoetbal.be" 
                 className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                info@harelbeekseminivoetbal.be
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Phone className="w-5 h-5 mr-2" />
                Telefoon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">Bereikbaar op werkdagen:</p>
              <a href="tel:+32123456789" 
                 className="text-purple-600 hover:text-purple-800 font-medium transition-colors">
                +32 123 456 789
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AlgemeenTab;