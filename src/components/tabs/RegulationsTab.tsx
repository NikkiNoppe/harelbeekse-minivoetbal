
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const RegulationsTab: React.FC = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      <section className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6 text-center">Reglement</h2>
        
        <p className="text-muted-foreground mb-8 text-center">
          Dit reglement bevat de officiële regels en richtlijnen voor alle competities
          georganiseerd door Harelbeekse minivoetbal competitie.
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-medium">1. Algemene Bepalingen</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>1.1 De competitie wordt georganiseerd door Voetbal Arena.</p>
              <p>1.2 Alle wedstrijden worden gespeeld volgens de regels van de KNVB, tenzij anders vermeld in dit reglement.</p>
              <p>1.3 Deelnemende teams dienen zich te houden aan alle bepalingen in dit reglement.</p>
              <p>1.4 Het bestuur heeft het recht om beslissingen te nemen in gevallen waarin dit reglement niet voorziet.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-medium">2. Competitie Structuur</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>2.1 De competitie bestaat uit een volledige competitie waarin alle teams elkaar twee keer ontmoeten (thuis en uit).</p>
              <p>2.2 Voor een overwinning krijgt een team 3 punten, voor een gelijkspel 1 punt, en voor een nederlaag 0 punten.</p>
              <p>2.3 De eindrangschikking wordt bepaald door:</p>
              <ul className="list-disc pl-5">
                <li>Totaal aantal behaalde punten</li>
                <li>Doelsaldo</li>
                <li>Aantal gescoorde doelpunten</li>
                <li>Onderling resultaat</li>
                <li>Loting (indien nodig)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-medium">3. Wedstrijdregels</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>3.1 Elke wedstrijd duurt 2 x 45 minuten met een rust van 15 minuten.</p>
              <p>3.2 Teams dienen 30 minuten voor aanvang van de wedstrijd aanwezig te zijn.</p>
              <p>3.3 Een team moet minimaal 7 spelers op het veld hebben om een wedstrijd te kunnen starten.</p>
              <p>3.4 Er mogen maximaal 5 wisselspelers worden gebruikt per wedstrijd.</p>
              <p>3.5 De thuisspelende vereniging zorgt voor een wedstrijdbal die voldoet aan de eisen.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-medium">4. Spelers & Registratie</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>4.1 Alle spelers moeten geregistreerd zijn bij hun club en bij de competitie-organisatie.</p>
              <p>4.2 Een speler mag in een seizoen slechts voor één club uitkomen.</p>
              <p>4.3 De registratietermijn sluit 2 weken voor aanvang van de competitie.</p>
              <p>4.4 In de winterstop mogen nieuwe spelers worden geregistreerd binnen de aangegeven transferperiode.</p>
              <p>4.5 Spelers moeten minimaal 16 jaar zijn om deel te nemen aan de competitie.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-medium">5. Disciplinaire Zaken</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>5.1 De competitieorganisatie hanteert een systeem van gele en rode kaarten conform KNVB-regels.</p>
              <p>5.2 Een speler die een rode kaart ontvangt, is automatisch geschorst voor de eerstvolgende wedstrijd.</p>
              <p>5.3 Na 4 gele kaarten volgt een schorsing van één wedstrijd.</p>
              <p>5.4 Het tuchtcomité kan aanvullende straffen opleggen bij ernstige overtredingen.</p>
              <p>5.5 Beroep tegen een beslissing van het tuchtcomité moet binnen 3 dagen na bekendmaking schriftelijk worden ingediend.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-medium">6. Bekercompetitie</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>6.1 De bekercompetitie wordt gespeeld volgens het knock-out systeem.</p>
              <p>6.2 Bij een gelijkspel worden er direct strafschoppen genomen (geen verlenging).</p>
              <p>6.3 De finale wordt gespeeld op een neutrale locatie, aangewezen door de organisatie.</p>
              <p>6.4 Schorsingen in de competitie gelden ook voor bekerwedstrijden en vice versa.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-medium">7. Wedstrijdverplaatsingen</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>7.1 Een verzoek tot wedstrijdverplaatsing moet minimaal 10 dagen van tevoren worden ingediend.</p>
              <p>7.2 Het verzoek moet worden goedgekeurd door zowel de tegenstander als de competitieleiding.</p>
              <p>7.3 Verplaatsingen vanwege weersomstandigheden worden door de scheidsrechter of competitieleiding bepaald.</p>
              <p>7.4 Uitgestelde wedstrijden moeten binnen 3 weken worden ingehaald, tenzij anders bepaald door de competitieleiding.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-medium">8. Slotbepalingen</AccordionTrigger>
            <AccordionContent className="space-y-3 text-muted-foreground">
              <p>8.1 Dit reglement is vastgesteld door het bestuur van Voetbal Arena op 1 augustus 2023.</p>
              <p>8.2 Wijzigingen in dit reglement kunnen alleen door het bestuur worden aangebracht.</p>
              <p>8.3 In alle gevallen waarin dit reglement niet voorziet, beslist het bestuur.</p>
              <p>8.4 Door deelname aan de competitie accepteren alle clubs en spelers dit reglement.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="max-w-3xl mx-auto mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Contact Tuchtcommissie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Voor vragen over het reglement of om beroep aan te tekenen tegen disciplinaire beslissingen,
              kunt u contact opnemen met de tuchtcommissie:
            </p>
            <div className="bg-muted/40 p-4 rounded-lg">
              <p><strong>Email:</strong> info@voetbalcommisie.be</p>
              <p className="text-xs mt-2 text-muted-foreground">Beroepen moeten per mail worden ingediend binnen 5 werkdagen na een beslissing.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default RegulationsTab;
