
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

// Reusable badge for rule numbers
const RuleNumberBadge = ({ number }: { number: string }) => (
  <span
    className="inline-block min-w-[2.25rem] text-center mr-3 mb-1 align-top bg-purple-100 text-purple-600 font-semibold rounded-full px-2.5 py-0.5 text-xs shadow-sm"
    aria-label={`Artikel ${number}`}
  >
    {number}
  </span>
);

// Helper: display number as badge before text, with optional children
const RuleItem = ({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) => (
  <li className="flex items-start mb-1 last:mb-0">
    <RuleNumberBadge number={number} />
    <div className="flex-1 leading-snug">{children}</div>
  </li>
);

const accordionSections = [
  {
    value: "item-1",
    title: "1. Algemene Bepalingen",
    content: (
      <ul className="space-y-2">
        <RuleItem number="1.1">
          De Harelbeekse Minivoetbal vereniging is opgericht met als doel de sportbeleving te bevorderen onder vorm van minivoetbal in een competitiecontext. Fairplay moet altijd op de eerste plaats staan.
        </RuleItem>
        <RuleItem number="1.2">
          Het bestuur bestaat uit de voorzitter, de ondervoorzitter, de secretaris en de scheidsrechtersverantwoordelijke. Het organiseert de competitie volgens dit reglement.
        </RuleItem>
        <RuleItem number="1.3">
          Het bestuur houdt algemene vergaderingen met verplichte aanwezigheid van elke ploeg. Het sportcomité behandelt disciplinaire zaken en geschillen.
        </RuleItem>
        <RuleItem number="1.4">
          Het bestuur heeft het recht om beslissingen te nemen in gevallen waarin dit reglement niet voorziet.
        </RuleItem>
        <RuleItem number="1.5">
          Door deelname aan de competitie gaan alle ploegen akkoord met het bijhouden en verwerken van gegevens door het bestuur.
        </RuleItem>
      </ul>
    ),
  },
  {
    value: "item-2",
    title: "2. Competitie Structuur",
    content: (
      <ul className="space-y-2">
        <RuleItem number="2.1">
          De klassering wordt bepaald door: wedstrijd gewonnen = 3 punten, gelijkspel = 1 punt per ploeg, verloren wedstrijd = 0 punten.
        </RuleItem>
        <RuleItem number="2.2">
          Bij gelijke punten tellen achtereenvolgens:
          <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
            <li>Het aantal gewonnen wedstrijden</li>
            <li>Het doelpuntensaldo</li>
            <li>Het totaal aantal gemaakte doelpunten</li>
            <li>Testmatch (indien nodig)</li>
          </ul>
        </RuleItem>
        <RuleItem number="2.3">
          Stoppende ploegen: Alle resterende wedstrijden van stoppende ploegen worden op forfaitscores gezet.
        </RuleItem>
        <RuleItem number="2.4">
          De fairplayranking wordt per reeks bijgehouden op basis van minst behaalde kaarten.
        </RuleItem>
      </ul>
    ),
  },
  {
    value: "item-3",
    title: "3. Wedstrijdregels",
    content: (
      <ul className="space-y-2">
        <RuleItem number="3.1">Competitiewedstrijden: 4 periodes van 12 minuten.</RuleItem>
        <RuleItem number="3.2">Rust: 1 minuut na periode 1 en 3, 2 minuten + kampwissel na periode 2.</RuleItem>
        <RuleItem number="3.3">Een ploeg moet minimaal 4 spelers hebben om te kunnen starten. Bij minder dan 4 spelers wordt forfait uitgesproken.</RuleItem>
        <RuleItem number="3.4">Belangrijke spelregels: sliding verboden, geen vaste doelman, niemand mag bal met hand spelen, geen buitenspel, lichamelijk contact verboden.</RuleItem>
        <RuleItem number="3.5">De thuisploeg zorgt voor een geschikte bal. Bij aftrap en doeltrap kan niet rechtstreeks gescoord worden.</RuleItem>
        <RuleItem number="3.6">
          Na 4 hoekschoppen wordt een strafcorner toegekend. Speler A trapt, speler B kopt naar onverdedigd doel.
        </RuleItem>
        <RuleItem number="3.7">Bij gelijkstand in knockoutfase: strafschoppen met 5 spelers per ploeg.</RuleItem>
      </ul>
    ),
  },
  {
    value: "item-4",
    title: "4. Spelers & Registratie",
    content: (
      <ul className="space-y-2">
        <RuleItem number="4.1">Minivoetbal wordt gespeeld met 5 spelers per ploeg. Maximum 3 reserves + 1 coach op de bank.</RuleItem>
        <RuleItem number="4.2">Vervangingen zijn voortdurend mogelijk na melding aan scheidsrechter, als de bal buiten het speelveld is.</RuleItem>
        <RuleItem number="4.3">Spelers moeten minimaal 16 jaar zijn. Maximum 20 spelers per ploeg, minimum 8 spelers.</RuleItem>
        <RuleItem number="4.4">Geen spelers uit hogere afdelingen dan 1ste Provinciale zijn toegestaan.</RuleItem>
        <RuleItem number="4.5">Overgangen tussen ploegen tijdens lopende competitie zijn verboden. Nieuwe spelers aansluiten kan tot net start van de competitie.</RuleItem>
        <RuleItem number="4.6">Identieke uitrusting per ploeg verplicht. Sportschoenen met effen zool. Kapitein draagt armband.</RuleItem>
        <RuleItem number="4.7">Verplichte sportongevallenverzekering voor elke speler (eigen verzekering of collectief via vereniging).</RuleItem>
      </ul>
    ),
  },
  {
    value: "item-5",
    title: "5. Disciplinaire Zaken",
    content: (
      <ul className="space-y-2">
        <RuleItem number="5.1">Gele kaart (boete: €): Speler mag verder spelen.</RuleItem>
        <RuleItem number="5.2">Rode kaart (boete: €): onmiddellijke uitsluiting ZONDER vervanging.</RuleItem>
        <RuleItem number="5.3">
          Schorsingen na gele kaarten:
          <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
            <li>2 gele kaarten: 1 wedstrijd schorsing</li>
            <li>4 gele kaarten: 2 opeenvolgende wedstrijden</li>
            <li>6 gele kaarten: 3 opeenvolgende wedstrijden</li>
          </ul>
        </RuleItem>
        <RuleItem number="5.4">
          Schorsingen na rode kaart:
          <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
            <li>Minimum schorsing: 1 wedstrijden schorsing</li>
            <li>Minnelijke schikking mogelijk, als de sportcomité dit beslist.</li>
          </ul>
        </RuleItem>
        <RuleItem number="5.5">
          Het sportcomité kan spelers oproepen. Bij negeren oproeping: minimum 10 wedstrijden schorsing.
        </RuleItem>
        <RuleItem number="5.6">
          Forfait heeft een uitslag van 10-0 (boete: €): bij afwezigheid, minder dan 4 spelers, of weigering zaal verlaten. Verwittigd forfait (1 dag vooraf) heeft lagere boete.
        </RuleItem>
        <RuleItem number="5.7">
          Beroep moet per mail worden ingediend binnen 7 werkdagen na een beslissing.
        </RuleItem>
      </ul>
    ),
  },
  {
    value: "item-6",
    title: "6. Bekercompetitie",
    content: (
      <ul className="space-y-2">
        <RuleItem number="6.1">
          Alle ploegen worden via loting verdeeld en wordt gespeeld volgens knock-out systeem, bij ongelijke verdeling schuiven de finalisten van vorig jaar een ronde verder.
        </RuleItem>
        <RuleItem number="6.2">
          Bij gelijkstand in knockoutfase worden direct strafschoppen genomen (geen verlenging). 5 spelers per ploeg.
        </RuleItem>
        <RuleItem number="6.3">
          Schorsingen in competitie gelden ook voor bekerwedstrijden en vice versa.
        </RuleItem>
      </ul>
    ),
  },
  {
    value: "item-7",
    title: "7. Wedstrijdformulieren",
    content: (
      <ul className="space-y-2">
        <RuleItem number="7.1">
          Wedstrijdformulier beschikbaar via website. ploegen vullen aan ten laatste 5 min voor tijd in.
        </RuleItem>
        <RuleItem number="7.2">
          Identiteitsbewijzen verplicht bij wedstrijdblad. Spelers zonder geldig ID kunnen enkel deelnemen mits toelating scheidsrechter.
        </RuleItem>
        <RuleItem number="7.3">
          Scheidsrechters aangesteld door bestuur. Bij afwezigheid: bezoekende ploeg duidt eerst vervanger aan, anders thuisploeg.
        </RuleItem>
        <RuleItem number="7.4">
          Forfait bij 8 minuten na officieel aanvangsuur met minder dan 4 spelers. Te late spelers kunnen nog deelnemen mits ID aan scheidsrechter.
        </RuleItem>
        <RuleItem number="7.5">
          Bal van thuisploeg wordt gebruikt. Schade aan terrein/scorebord melden aan scheidsrechter.
        </RuleItem>
      </ul>
    ),
  },
  {
    value: "item-8",
    title: "8. Slotbepalingen",
    content: (
      <ul className="space-y-2">
        <RuleItem number="8.1">
          Deelnamesom bestaat uit inschrijvingsgeld en eventuele waarborgsom voor nieuwe ploegen. Bedragen jaarlijks door bestuur bepaald.
        </RuleItem>
        <RuleItem number="8.2">
          Niet betaalde bedragen ingehouden van waarborgsom. Laattijdige betaling wordt beboet. Aanvang competitie geldt als betalingsdatum.
        </RuleItem>
        <RuleItem number="8.3">
          Inschrijving tegen door bestuur bepaalde datum. Spelerslijst voor competitiestart indienen met alle vereiste gegevens.
        </RuleItem>
        <RuleItem number="8.4">
          Klachten binnen 7 dagen bij bestuur. Wijzigingen ploegverantwoordelijken direct melden. Naamsveranderingen enkel in tussenseizoen.
        </RuleItem>
        <RuleItem number="8.5">
          Sporthalreglement wordt overgenomen. Laatste wedstrijdploegen plaatsen doelen terug in berging.
        </RuleItem>
        <RuleItem number="8.6">
          Dit reglement treedt in werking bij goedkeuring bestuur en vervangt alle vorige versies. Bestuur niet verantwoordelijk voor schade door onsportief gedrag.
        </RuleItem>
      </ul>
    ),
  }
];

const RegulationsTab: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6 animate-slide-up">
      <section className="max-w-3xl mx-auto px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 my-[30px] text-left">Reglement</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 text-center px-2">
          Dit reglement bevat de officiële regels en richtlijnen voor alle competities
          georganiseerd door Harelbeekse minivoetbal competitie.
        </p>
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-0">
            <Accordion
              type="single"
              collapsible
              className="w-full transition-all duration-200"
            >
              {accordionSections.map(({ value, title, content }, idx) => {
                // Which trigger(s) get rounded?
                const isFirst = idx === 0;
                const isLast = idx === accordionSections.length - 1;
                let triggerRounded = "";
                if (isFirst) triggerRounded = "rounded-t-xl";
                if (isLast) triggerRounded = "rounded-b-xl";
                return (
                  <AccordionItem
                    key={value}
                    value={value}
                    className={`border-0 bg-white ${isFirst ? "mt-0" : ""} ${isLast ? "mb-0" : ""} transition-all`}
                  >
                    <AccordionTrigger
                      className={`w-full text-left text-base sm:text-lg font-medium px-4 sm:px-6 py-3 sm:py-4 bg-white border-0 hover:bg-purple-50 hover:text-purple-600 shadow-none transition ${triggerRounded}`}
                    >
                      {title}
                    </AccordionTrigger>
                    <AccordionContent className="bg-white py-4 px-4 sm:px-6 text-sm sm:text-base text-muted-foreground">
                      <div>
                        {content}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section className="max-w-3xl mx-auto mt-8 sm:mt-12 px-2 sm:px-0">
        <Card>
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="text-base sm:text-lg">Contact Tuchtcommissie</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Voor vragen over het reglement of om beroep aan te tekenen tegen disciplinaire beslissingen,
              kunt u contact opnemen met de tuchtcommissie:
            </p>
            <div className="bg-muted/40 p-3 sm:p-4 rounded-lg">
              <p className="text-sm sm:text-base"><strong>Email:</strong> noppe.nikki@icloud.com</p>
              <p className="text-xs sm:text-sm mt-2 text-muted-foreground">Beroepen moeten per mail worden ingediend binnen 7 werkdagen na een beslissing.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default RegulationsTab;
