import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const REGULATIONS = [
  {
    id: "item-1",
    title: "1. Algemene Bepalingen",
    content: [
      "1.1 De Harelbeekse Minivoetbal vereniging is opgericht met als doel de sportbeleving te bevorderen onder vorm van minivoetbal in een competitiecontext. Fairplay moet altijd op de eerste plaats staan.",
      "1.2 Het bestuur bestaat uit de voorzitter, de ondervoorzitter, de secretaris en de scheidsrechtersverantwoordelijke. Het organiseert de competitie volgens dit reglement.",
      "1.3 Het bestuur houdt algemene vergaderingen met verplichte aanwezigheid van elke ploeg. Het sportcomité behandelt disciplinaire zaken en geschillen.",
      "1.4 Het bestuur heeft het recht om beslissingen te nemen in gevallen waarin dit reglement niet voorziet.",
      "1.5 Door deelname aan de competitie gaan alle ploegen akkoord met het bijhouden en verwerken van gegevens door het bestuur."
    ]
  },
  {
    id: "item-2",
    title: "2. Wedstrijdreglement",
    content: [
      "2.1 Een wedstrijd duurt 2 x 20 minuten met een pauze van 5 minuten.",
      "2.2 Elke ploeg speelt met 5 spelers (4 veldspelers + 1 keeper).",
      "2.3 Er mogen maximaal 10 spelers per ploeg ingeschreven worden.",
      "2.4 Onbeperkt wisselen is toegestaan.",
      "2.5 De bal mag niet boven schouderhoogte gespeeld worden."
    ]
  },
  {
    id: "item-3",
    title: "3. Disciplinaire Maatregelen",
    content: [
      "3.1 Gele kaart: Speler mag verder spelen.",
      "3.2 Rode kaart: Onmiddellijke uitsluiting zonder vervanging.",
      "3.3 2 gele kaarten: 1 wedstrijd schorsing",
      "3.4 4 gele kaarten: 2 opeenvolgende wedstrijden schorsing",
      "3.5 6 gele kaarten: 3 opeenvolgende wedstrijden schorsing"
    ]
  }
];

const RegulationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {REGULATIONS.map((regulation) => (
              <AccordionItem key={regulation.id} value={regulation.id}>
                <AccordionTrigger className="text-base sm:text-lg font-medium p-3 sm:p-4">
                  {regulation.title}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground px-3 sm:px-4">
                  {regulation.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegulationsTab;