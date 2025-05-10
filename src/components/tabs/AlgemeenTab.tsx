import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
const AlgemeenTab: React.FC = () => {
  const newsItems = [{
    id: 1,
    title: "Zoektocht naar hoofdsponsor 2025-2026",
    date: "10 mei 2025",
    content: "De Harelbeekse Minivoetbal Competitie is op zoek naar een nieuwe hoofdsponsor voor het komende seizoen. Geïnteresseerde bedrijven kunnen contact opnemen via info@minivoetbalharelbeke.be.",
    category: "Sponsoring"
  }, {
    id: 2,
    title: "Nieuwe scheidsrechters gezocht",
    date: "5 mei 2025",
    content: "Voor het komende seizoen zijn we op zoek naar nieuwe scheidsrechters. Ervaring is een plus, maar geen vereiste. Een opleiding wordt voorzien. Interesse? Neem contact op met de competitieleiding.",
    category: "Scheidsrechters"
  }, {
    id: 3,
    title: "Aankondiging jaarlijkse barbecue",
    date: "1 mei 2025",
    content: "De jaarlijkse barbecue zal plaatsvinden op 20 juli 2025. Alle spelers, sponsors en supporters zijn welkom. Meer info volgt binnenkort.",
    category: "Evenement"
  }];
  return <div className="space-y-8 animate-slide-up">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Over de Competitie</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4">
              De Harelbeekse Minivoetbal Competitie is opgericht in 1985 en is uitgegroeid tot een vaste waarde in de regio. Met momenteel 6 teams strijden we elk seizoen voor de felbegeerde titel.
            </p>
            <p className="mb-4">
              Onze competitie staat bekend om zijn sportiviteit en gezelligheid. Na elke wedstrijd is er tijd voor een drankje en een babbel in de kantine.
            </p>
            <p>
              Interesse om deel te nemen met een team? Neem dan contact op via info@minivoetbalharelbeke.be.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Laatste Nieuws</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {newsItems.map(item => <Card key={item.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className="w-fit bg-soccer-green/10 border-soccer-green/20 text-soccer-green">
                    {item.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.date}</span>
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{item.content}</p>
              </CardContent>
            </Card>)}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Competitieleiding</h3>
                <p>Nikki Noppe</p>
                <p>info@minivoetbalharelbeke.be</p>
                <p>+32 468 15 52 16</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Locatie</h3>
                <p>Sporthal De Dageraad</p>
                <p>Stasegemsesteenweg 21</p>
                <p>8530 Harelbeke</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>;
};
export default AlgemeenTab;