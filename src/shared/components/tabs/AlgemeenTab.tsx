import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Calendar, Users, Trophy, MapPin, Clock, Star, Mail, Phone } from "lucide-react";

const AlgemeenTab = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
                <Trophy className="w-4 h-4 mr-2" />
                Seizoen 2024-2025
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

      {/* News Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-purple-800">Laatste Nieuws</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Star className="w-4 h-4 mr-1" />
            Nieuw
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-600 text-white">Competitie</Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  2 dagen geleden
                </div>
              </div>
              <CardTitle className="text-xl text-purple-800 mt-3">
                Nieuwe seizoen gestart!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Het nieuwe seizoen 2024-2025 is officieel van start gegaan met recordaantallen 
                inschrijvingen. Alle teams zijn klaar voor een fantastisch seizoen vol spanning en sportiviteit.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-600 text-white">Event</Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  1 week geleden
                </div>
              </div>
              <CardTitle className="text-xl text-purple-800 mt-3">
                Teambuilding activiteiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Naast de competitie organiseren we ook regelmatig teambuilding evenementen 
                en sociale activiteiten om de gemeenschap te versterken.
              </p>
            </CardContent>
          </Card>
        </div>
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