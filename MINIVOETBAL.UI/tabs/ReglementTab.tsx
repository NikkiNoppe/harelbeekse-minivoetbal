import React, { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Mail, FileText, Scale } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

// Reusable badge for rule numbers
const RuleNumberBadge = memo(({ number }: { number: string }) => (
  <span
    className="inline-block min-w-[2.25rem] text-center mr-3 mb-1 align-top bg-purple-100 text-purple-600 font-semibold rounded-full px-2.5 py-0.5 text-xs shadow-sm"
    aria-label={`Artikel ${number}`}
  >
    {number}
  </span>
));

RuleNumberBadge.displayName = 'RuleNumberBadge';

// Helper: display number as badge before text, with optional children
const RuleItem = memo(({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) => (
  <li className="flex items-start mb-3 last:mb-0">
    <RuleNumberBadge number={number} />
    <div className="flex-1 leading-snug">{children}</div>
  </li>
));

RuleItem.displayName = 'RuleItem';

// New component for subsection titles
const SubTitle = memo(({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) => (
  <li className="flex items-start mb-4 mt-6 first:mt-0">
    <RuleNumberBadge number={number} />
    <div className="flex-1 leading-snug font-semibold text-base text-purple-700">{children}</div>
  </li>
));

SubTitle.displayName = 'SubTitle';

// Memoized accordion sections
const GeneralProvisions = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
    <RuleItem number="1.1">
      De Harelbeekse Minivoetbalvereniging zet zich in om de passie voor minivoetbal te delen en te bevorderen binnen een sportieve en competitieve omgeving. Plezier, respect en fairplay staan hierbij altijd centraal.
    </RuleItem>
    <RuleItem number="1.2">
      Het bestuur is verantwoordelijk voor de organisatie van de competitie en de naleving van dit reglement. Het bestuur bestaat uit:
      <ul className="list-disc pl-4 mt-1 text-sm">
        <li>Voorzitter: Wesley Dedeurwaerder</li>
        <li>Secretaris: Nikki Noppe</li>
      </ul>
    </RuleItem>
    <RuleItem number="1.3">
      Het bestuur heeft het recht om beslissingen te nemen in gevallen waarin dit reglement niet voorziet, steeds in de geest van de vereniging.
    </RuleItem>
    <RuleItem number="1.4">
      Alle ploegen gaan door deelname aan de competitie akkoord met het bijhouden en verwerken van gegevens door het bestuur, conform de geldende GDPR-wetgeving.
    </RuleItem>
    <RuleItem number="1.5">
      Het bestuur organiseert algemene vergaderingen waarvoor de aanwezigheid van elke ploeg verplicht is. Disciplinaire zaken en geschillen worden behandeld door het sportcomité. Voor contact met het bestuur kan men terecht via de officiële website van de vereniging.
    </RuleItem>
  </ul>
));

const MatchRules = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
    <SubTitle number="2.1">Gedrag op en rond het veld</SubTitle>
    <RuleItem number="2.1.1">Alle spelers, coaches en supporters worden geacht zich sportief en respectvol te gedragen tegenover scheidsrechters, tegenstanders, medespelers en andere aanwezigen.</RuleItem>
    <RuleItem number="2.1.2">Ongepast gedrag, verbaal of fysiek geweld, pesten, racisme of andere vormen van discriminatie worden niet getolereerd en kunnen leiden tot sancties door het bestuur of het sportcomité.</RuleItem>
    <RuleItem number="2.1.3">Enkel de kapitein mag op een respectvolle manier vragen stellen aan de scheidsrechter.</RuleItem>
    <RuleItem number="2.1.4">Supporters worden gevraagd hun ploeg positief aan te moedigen en zich te onthouden van negatief of storend gedrag.</RuleItem>
    <RuleItem number="2.1.5">Het bestuur en de scheidsrechters hebben het recht om personen die zich niet aan deze gedragsregels houden, te verwijderen uit de sporthal.</RuleItem>

    <SubTitle number="2.2">Opstelling en aantal spelers</SubTitle>
    <RuleItem number="2.2.1">Een wedstrijd wordt gespeeld door twee ploegen van elk 5 veldspelers.</RuleItem>
    <RuleItem number="2.2.2">Elke ploeg mag maximaal 3 reservespelers en 1 coach op de bank hebben.</RuleItem>
    <RuleItem number="2.2.3">Een ploeg moet bij aanvang van de wedstrijd minstens 4 spelers op het veld hebben. Bij minder dan 4 spelers wordt forfait uitgesproken en de wedstrijd niet gestart.</RuleItem>
    <RuleItem number="2.2.4">Indien een ploeg tijdens de wedstrijd wordt herleid tot 3 spelers, wordt de wedstrijd stopgezet. Het bestuur bepaalt nadien de uitslag.</RuleItem>

    <SubTitle number="2.3">Wedstrijdverloop</SubTitle>
    <RuleItem number="2.3.1">Een competitiewedstrijd bestaat uit 4 periodes van telkens 12 minuten.</RuleItem>
    <RuleItem number="2.3.2">Er is 1 minuut rust na de eerste en derde periode, en 2 minuten rust (met kampwissel) na de tweede periode.</RuleItem>

    <SubTitle number="2.4">Verboden handelingen</SubTitle>
    <RuleItem number="2.4.1">De volgende handelingen zijn verboden en worden bestraft met een rechtstreekse vrije trap of strafschop:
      <ul className="list-disc pl-4 mt-1 text-sm">
        <li>Sliding, met of zonder tegenstander in de buurt</li>
        <li>Hakje met de hiel</li>
        <li>Spelen van de bal met de hand</li>
        <li>Lichamelijk contact (in welke vorm dan ook is niet toegestaan, inclusief duwen, trekken, blokkeren, vasthouden of schouderduw)</li>
        <li>Opzettelijk tijdrekken</li>
        <li>Onsportief gedrag (zoals natrappen, spuwen, beledigen)</li>
      </ul>
    </RuleItem>
    <RuleItem number="2.4.2">Het afschermen van de bal met het lichaam is enkel toegestaan wanneer de speler in balbezit is en geen overtreding maakt door de tegenstander te hinderen of vast te houden. Overdreven gebruik van het lichaam om de tegenstander te blokkeren is niet toegestaan.</RuleItem>
    <RuleItem number="2.4.3">Een onrechtstreekse vrije trap wordt toegekend wanneer de bal het plafond raakt of bij een scheidsrechterlijke beslissing waarbij geen directe overtreding is vastgesteld.</RuleItem>
    <RuleItem number="2.4.4">Overtredingen kunnen leiden tot bijkomende sancties door het sportcomité.</RuleItem>

    <SubTitle number="2.5">Spelregels</SubTitle>
    <RuleItem number="2.5.1">Er is geen vaste doelman: elke speler mag keepen, maar niemand mag de bal met de hand spelen.</RuleItem>
    <RuleItem number="2.5.2">Buitenspel bestaat niet in deze competitie.</RuleItem>
    <RuleItem number="2.5.3">De scheidsrechter zal de voordeelregel niet meer toepassen. Spelbederf en opzettelijke overtredingen worden hierdoor strenger bestraft.</RuleItem>
    <RuleItem number="2.5.4">Bij blokkage van de bal die buitengaat, wordt het voordeel toegekend aan de aanvallende partij.</RuleItem>

    <SubTitle number="2.6">Hoekschoppen en strafcorner</SubTitle>
    <RuleItem number="2.6.1">Na vier hoekschoppen voor dezelfde ploeg wordt een strafcorner toegekend.</RuleItem>
    <RuleItem number="2.6.2">Uitvoering strafcorner:
      <ul className="list-disc pl-4 mt-1 text-sm">
        <li>Speler A trapt de bal, speler B kopt de bal naar een onverdedigd doel.</li>
        <li>Geen enkele speler mag op of over de doellijn staan tot nadat de bal volledig over de doellijn is gegaan.</li>
        <li>Na het nemen van een strafcorner wordt het spel hervat na het fluitsignaal van de scheidsrechter.</li>
        <li>De verdedigers moeten zich buiten het strafschopgebied bevinden tot het fluitsignaal.</li>
      </ul>
    </RuleItem>

    <SubTitle number="2.7">Doeltrap en aftrap</SubTitle>
    <RuleItem number="2.7.1">De thuisploeg zorgt voor een geschikte bal.</RuleItem>
    <RuleItem number="2.7.2">Bij aftrap en doeltrap kan niet rechtstreeks gescoord worden.</RuleItem>
    <RuleItem number="2.7.3">Na het maken van een doelpunt volgt een doeltrap: beide teams begeven zich naar hun eigen speelhelft. De bal moet stilliggen achter de doellijn. Na het fluitsignaal van de scheidsrechter wordt de bal in het spel gebracht door een pas naar een medespeler buiten het doelgebied (4-meterlijn).</RuleItem>
    <RuleItem number="2.7.4">Bij een gewone doeltrap (niet na een doelpunt) mag de speler, nadat de bal stilligt voor de doellijn, met de bal het terrein opkomen.</RuleItem>

    <SubTitle number="2.8">Strafschopgebied</SubTitle>
    <RuleItem number="2.8.1">Het strafschopgebied is de ruimte tussen de 4-meterlijn en de doellijn.</RuleItem>

    <SubTitle number="2.9">Uitrusting en identificatie</SubTitle>
    <RuleItem number="2.9.1">Spelers moeten minimaal 16 jaar zijn. Een ploeg bestaat uit minimaal 8 en maximaal 20 spelers.</RuleItem>
    <RuleItem number="2.9.2">Spelers uit hogere afdelingen dan 1ste Provinciale zijn niet toegestaan.</RuleItem>
    <RuleItem number="2.9.3">Elke ploeg is verplicht om in identieke uitrusting te spelen. Sportschoenen met effen zool zijn verplicht. De kapitein draagt een armband.</RuleItem>
    <RuleItem number="2.9.4">Reservespelers nemen plaats op de bank aan de zijde van het scorebord.</RuleItem>
    <RuleItem number="2.9.5">Bij discussie over de kleur van de truien beslist de scheidsrechter of de thuisploeg moet veranderen. De kleuren vermeld op de kalender zijn van toepassing.</RuleItem>
  </ul>
));

const CompetitionStructure = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
    <RuleItem number="3.1">De klassering wordt bepaald door: gewonnen wedstrijd = 3 punten, gelijkspel = 1 punt per ploeg, verloren wedstrijd = 0 punten.</RuleItem>
    <RuleItem number="3.2">Bij gelijke punten wordt de rangschikking bepaald volgens deze volgorde:
      <ul className="list-disc pl-4 mt-1 text-sm">
        <li>Het aantal gewonnen wedstrijden</li>
        <li>Punten behaald in onderling gespeelde wedstrijden</li>
        <li>Doelpuntensaldo in onderling gespeelde wedstrijden</li>
        <li>Algemeen doelpuntensaldo</li>
        <li>Totaal aantal gemaakte doelpunten</li>
        <li>Testmatch of loting, indien nodig</li>
      </ul>
    </RuleItem>
    <RuleItem number="3.3">Wanneer een ploeg zich terugtrekt of stopt tijdens de competitie, worden alle resterende wedstrijden van die ploeg als forfait (verloren) genoteerd.</RuleItem>
    <RuleItem number="3.4">Indien een ploeg buiten competitie wordt gezet, blijven de punten behaald in een ronde behouden, op voorwaarde dat de ploeg alle wedstrijden in die ronde heeft gespeeld.</RuleItem>
    <RuleItem number="3.5">Alle ploegen worden via loting verdeeld voor de beker en spelen volgens het knock-out systeem. Bij een oneven aantal ploegen schuiven de finalisten van het vorige jaar automatisch een ronde verder. Dezelfde regels als in de competitie zijn van toepassing op de beker. Indien een ploeg niet opdaagt voor een bekerwedstrijd, wordt deze uitgesloten uit de beker, krijgt de tegenstander de overwinning toegekend en wordt een boete opgelegd.</RuleItem>
    <RuleItem number="3.6">Bij gelijkstand in de knock-outfase worden direct strafschoppen genomen (geen verlenging op uitzondering van de bekerfinale). Elke ploeg duidt 5 spelers aan.</RuleItem>
    <RuleItem number="3.7">Schorsingen opgelopen in de competitie gelden ook voor bekerwedstrijden en omgekeerd.</RuleItem>
  </ul>
));

const PlayersRegistration = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
    <RuleItem number="4.1">Overgangen tussen ploegen tijdens de lopende competitie zijn verboden. Nieuwe spelers aansluiten kan tot net voor de start van de competitie.</RuleItem>
    <RuleItem number="4.2">Elke ploeg moet voor de start van de competitie een volledige spelerslijst indienen via het digitaal platform, met alle vereiste gegevens (naam, geboortedatum).</RuleItem>
    <RuleItem number="4.3">De ploeg is verantwoordelijk voor het verzekeren van alle spelers tegen sportongevallen, hetzij via een eigen verzekering, hetzij via een collectieve verzekering. De vereniging is niet verantwoordelijk voor ongevallen of kwetsuren.</RuleItem>
    <RuleItem number="4.4">Spelers uit hogere afdelingen dan 1ste Provinciale zijn niet toegestaan.</RuleItem>
    <RuleItem number="4.5">Spelers zonder identiteitskaart of rijbewijs kunnen niet deelnemen aan de wedstrijd. Uitzonderlijk kan een digitale identificatie worden toegelaten, mits goedkeuring van de scheidsrechter. Indien een niet-geregistreerde speler toch deelneemt, wordt de forfaitscore uitgesproken en volgt een boete.</RuleItem>
    <RuleItem number="4.6">Elke ploeg is verplicht in identieke uitrusting te spelen. De kapitein draagt een armband; indien niet, volgt een boete.</RuleItem>
  </ul>
));

const DisciplinaryMatters = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
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
));

const CupCompetition = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
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
));

const MatchForms = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
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
));

const FinalProvisions = memo(() => (
  <ul className="space-y-4">
    <p className="mb-4"></p>
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
));

// Set display names for better debugging
GeneralProvisions.displayName = 'GeneralProvisions';
MatchRules.displayName = 'MatchRules';
CompetitionStructure.displayName = 'CompetitionStructure';
PlayersRegistration.displayName = 'PlayersRegistration';
DisciplinaryMatters.displayName = 'DisciplinaryMatters';
CupCompetition.displayName = 'CupCompetition';
MatchForms.displayName = 'MatchForms';
FinalProvisions.displayName = 'FinalProvisions';

// Contact section component
const ContactSection = memo(() => (
  <section>
    <h2 className="text-2xl font-semibold flex items-center gap-2">
      <Mail className="h-6 w-6" />
      Contact Tuchtcommissie
    </h2>
    <Card>
      <CardContent className="pt-4 sm:pt-6 bg-transparent">
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          Voor vragen over het reglement of om beroep aan te tekenen tegen disciplinaire beslissingen,
          kunt u contact opnemen met de tuchtcommissie:
        </p>
        <div className="bg-muted/40 p-3 sm:p-4 rounded-lg">
          <p className="text-sm sm:text-base"><strong>Email:</strong> noppe.nikki@icloud.com</p>
          <p className="text-xs sm:text-sm mt-2 text-muted-foreground">
            Beroepen moeten per mail worden ingediend binnen 7 werkdagen na een beslissing.
          </p>
        </div>
      </CardContent>
    </Card>
  </section>
));

ContactSection.displayName = 'ContactSection';

// Memoized accordion sections array
const useAccordionSections = () => {
  return useMemo(() => [
    {
      value: "item-1",
      title: "1. Algemene Bepalingen",
      content: <GeneralProvisions />
    },
    {
      value: "item-2",
      title: "2. Wedstrijdregels",
      content: <MatchRules />
    },
    {
      value: "item-3",
      title: "3. Competitieopbouw",
      content: <CompetitionStructure />
    },
    {
      value: "item-4",
      title: "4. Spelers & Inschrijving",
      content: <PlayersRegistration />
    },
    {
      value: "item-5",
      title: "5. Disciplinaire Zaken",
      content: <DisciplinaryMatters />
    },
    {
      value: "item-6",
      title: "6. Bekercompetitie",
      content: <CupCompetition />
    },
    {
      value: "item-7",
      title: "7. Wedstrijdformulieren",
      content: <MatchForms />
    },
    {
      value: "item-8",
      title: "8. Slotbepalingen",
      content: <FinalProvisions />
    }
  ], []);
};

// Regulations accordion component
const RegulationsAccordion = memo(() => {
  const accordionSections = useAccordionSections();

  return (
    <Card className="bg-white shadow-lg rounded-xl">
      <CardContent className="p-0">
        <Accordion
          type="single"
          collapsible
          className="w-full transition-all duration-200"
        >
          {accordionSections.map(({ value, title, content }, idx) => {
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
                <AccordionContent className="bg-white py-12 px-4 sm:px-6 text-sm sm:text-base text-muted-foreground">
                  {content}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
});

RegulationsAccordion.displayName = 'RegulationsAccordion';

// Header component
const RegulationsHeader = memo(() => (
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-semibold flex items-center gap-2">
      <Scale className="h-6 w-6" />
      Reglement
    </h2>
  </div>
));

RegulationsHeader.displayName = 'RegulationsHeader';

// Introduction section
const IntroductionSection = memo(() => (
  <section>
    <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 text-center px-2">
      Dit reglement bevat de officiële regels en richtlijnen voor alle competities
      georganiseerd door Harelbeekse minivoetbal competitie.
    </p>
    <RegulationsAccordion />
  </section>
));

IntroductionSection.displayName = 'IntroductionSection';

// Main component
const ReglementTab: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-8 animate-slide-up">
      <RegulationsHeader />
      <IntroductionSection />
      <ContactSection />
    </div>
  );
};

export default memo(ReglementTab); 