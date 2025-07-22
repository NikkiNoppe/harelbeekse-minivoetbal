import React from "react";
import { Accordion, AccordionItem, AccordionControl, AccordionPanel } from "@mantine/core";
import { Container, Stack, Text } from "@mantine/core";

const reglement = [
  {
    title: "1. Algemene Bepalingen",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>1.1</span><span className='block flex-1 text-justify'>De Harelbeekse Minivoetbalvereniging zet zich in om de passie voor minivoetbal te delen en te bevorderen binnen een sportieve en competitieve omgeving. Plezier, respect en fairplay staan hierbij altijd centraal.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>1.2</span><span className='block flex-1 text-justify'>Het bestuur is verantwoordelijk voor de organisatie van de competitie en de naleving van dit reglement. Het bestuur bestaat uit:<br />- Voorzitter: Wesley Dedeurwaerder<br />- Secretaris: Nikki Noppe</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>1.3</span><span className='block flex-1 text-justify'>Het bestuur heeft het recht om beslissingen te nemen in gevallen waarin dit reglement niet voorziet, steeds in de geest van de vereniging.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>1.4</span><span className='block flex-1 text-justify'>Alle ploegen gaan door deelname aan de competitie akkoord met het bijhouden en verwerken van gegevens door het bestuur, conform de geldende GDPR-wetgeving.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>1.5</span><span className='block flex-1 text-justify'>Het bestuur organiseert algemene vergaderingen waarvoor de aanwezigheid van elke ploeg verplicht is. Disciplinaire zaken en geschillen worden behandeld door het sportcomité. Voor contact met het bestuur kan men terecht via de officiële website van de vereniging.</span></p>
      </div>
    )
  },
  {
    title: "2. Wedstrijdregels",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.1 Gedrag op en rond het veld</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.1.1</span><span className='block flex-1 text-justify'>Alle spelers, coaches en supporters worden geacht zich sportief en respectvol te gedragen tegenover scheidsrechters, tegenstanders, medespelers en andere aanwezigen.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.1.2</span><span className='block flex-1 text-justify'>Ongepast gedrag, verbaal of fysiek geweld, pesten, racisme of andere vormen van discriminatie worden niet getolereerd en kunnen leiden tot sancties door het bestuur of het sportcomité.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.1.3</span><span className='block flex-1 text-justify'>Enkel de kapitein mag op een respectvolle manier vragen stellen aan de scheidsrechter.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.1.4</span><span className='block flex-1 text-justify'>Supporters worden gevraagd hun ploeg positief aan te moedigen en zich te onthouden van negatief of storend gedrag.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.1.5</span><span className='block flex-1 text-justify'>Het bestuur en de scheidsrechters hebben het recht om personen die zich niet aan deze gedragsregels houden, te verwijderen uit de sporthal.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.2 Opstelling en aantal spelers</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.2.1</span><span className='block flex-1 text-justify'>Een wedstrijd wordt gespeeld door twee ploegen van elk 5 veldspelers.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.2.2</span><span className='block flex-1 text-justify'>Elke ploeg mag maximaal 3 reservespelers en 1 coach op de bank hebben.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.2.3</span><span className='block flex-1 text-justify'>Een ploeg moet bij aanvang van de wedstrijd minstens 4 spelers op het veld hebben. Bij minder dan 4 spelers wordt forfait uitgesproken en de wedstrijd niet gestart.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.2.4</span><span className='block flex-1 text-justify'>Indien een ploeg tijdens de wedstrijd wordt herleid tot 3 spelers, wordt de wedstrijd stopgezet. Het bestuur bepaalt nadien de uitslag.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.3 Wedstrijdverloop</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.3.1</span><span className='block flex-1 text-justify'>Een competitiewedstrijd bestaat uit 4 periodes van telkens 12 minuten.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.3.2</span><span className='block flex-1 text-justify'>Er is 1 minuut rust na de eerste en derde periode, en 2 minuten rust (met kampwissel) na de tweede periode.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.4 Verboden handelingen</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.4.1</span><span className='block flex-1 text-justify'>De volgende handelingen zijn verboden en worden bestraft met een rechtstreekse vrije trap of strafschop:<br />- Sliding, met of zonder tegenstander in de buurt<br />- Hakje met de hiel<br />- Spelen van de bal met de hand<br />- Lichamelijk contact (in welke vorm dan ook is niet toegestaan, inclusief duwen, trekken, blokkeren, vasthouden of schouderduw)<br />- Opzettelijk tijdrekken<br />- Onsportief gedrag (zoals natrappen, spuwen, beledigen)</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.4.2</span><span className='block flex-1 text-justify'>Het afschermen van de bal met het lichaam is enkel toegestaan wanneer de speler in balbezit is en geen overtreding maakt door de tegenstander te hinderen of vast te houden. Overdreven gebruik van het lichaam om de tegenstander te blokkeren is niet toegestaan.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.4.3</span><span className='block flex-1 text-justify'>Een onrechtstreekse vrije trap wordt toegekend wanneer de bal het plafond raakt of bij een scheidsrechterlijke beslissing waarbij geen directe overtreding is vastgesteld.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.4.4</span><span className='block flex-1 text-justify'>Overtredingen kunnen leiden tot bijkomende sancties door het sportcomité.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.5 Spelregels</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.5.1</span><span className='block flex-1 text-justify'>Er is geen vaste doelman: elke speler mag keepen, maar niemand mag de bal met de hand spelen.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.5.2</span><span className='block flex-1 text-justify'>Buitenspel bestaat niet in deze competitie.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.5.3</span><span className='block flex-1 text-justify'>De scheidsrechter zal de voordeelregel niet meer toepassen. Spelbederf en opzettelijke overtredingen worden hierdoor strenger bestraft.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.5.4</span><span className='block flex-1 text-justify'>Bij blokkage van de bal die buitengaat, wordt het voordeel toegekend aan de aanvallende partij.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.6 Hoekschoppen en strafcorner</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.6.1</span><span className='block flex-1 text-justify'>Na vier hoekschoppen voor dezelfde ploeg wordt een strafcorner toegekend.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.6.2</span><span className='block flex-1 text-justify'>Uitvoering strafcorner:<br />- Speler A trapt de bal, speler B kopt de bal naar een onverdedigd doel.<br />- Geen enkele speler mag op of over de doellijn staan tot nadat de bal volledig over de doellijn is gegaan.<br />- Na het nemen van een strafcorner wordt het spel hervat na het fluitsignaal van de scheidsrechter.<br />- De verdedigers moeten zich buiten het strafschopgebied bevinden tot het fluitsignaal.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.7 Doeltrap en aftrap</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.7.1</span><span className='block flex-1 text-justify'>De thuisploeg zorgt voor een geschikte bal.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.7.2</span><span className='block flex-1 text-justify'>Bij aftrap en doeltrap kan niet rechtstreeks gescoord worden.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.7.3</span><span className='block flex-1 text-justify'>Na het maken van een doelpunt volgt een doeltrap: beide teams begeven zich naar hun eigen speelhelft. De bal moet stilliggen achter de doellijn. Na het fluitsignaal van de scheidsrechter wordt de bal in het spel gebracht door een pas naar een medespeler buiten het doelgebied (4-meterlijn).</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.7.4</span><span className='block flex-1 text-justify'>Bij een gewone doeltrap (niet na een doelpunt) mag de speler, nadat de bal stilligt voor de doellijn, met de bal het terrein opkomen.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.8 Strafschopgebied</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.8.1</span><span className='block flex-1 text-justify'>Het strafschopgebied is de ruimte tussen de 4-meterlijn en de doellijn.</span></p>
        <h3 className="font-semibold text-purple-700 mt-2 pl-4">2.9 Uitrusting en identificatie</h3>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.9.1</span><span className='block flex-1 text-justify'>Spelers moeten minimaal 16 jaar zijn. Een ploeg bestaat uit minimaal 8 en maximaal 20 spelers.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.9.2</span><span className='block flex-1 text-justify'>Spelers uit hogere afdelingen dan 1ste Provinciale zijn niet toegestaan.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.9.3</span><span className='block flex-1 text-justify'>Elke ploeg is verplicht om in identieke uitrusting te spelen. Sportschoenen met effen zool zijn verplicht. De kapitein draagt een armband.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.9.4</span><span className='block flex-1 text-justify'>Reservespelers nemen plaats op de bank aan de zijde van het scorebord.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>2.9.5</span><span className='block flex-1 text-justify'>Bij discussie over de kleur van de truien beslist de scheidsrechter of de thuisploeg moet veranderen. De kleuren vermeld op de kalender zijn van toepassing.</span></p>
      </div>
    )
  },
  {
    title: "3. Competitieopbouw",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.1</span><span className='block flex-1 text-justify'>De klassering wordt bepaald door: gewonnen wedstrijd = 3 punten, gelijkspel = 1 punt per ploeg, verloren wedstrijd = 0 punten.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.2</span><span className='block flex-1 text-justify'>Bij gelijke punten wordt de rangschikking bepaald volgens deze volgorde:<br />- Het aantal gewonnen wedstrijden<br />- Punten behaald in onderling gespeelde wedstrijden<br />- Doelpuntensaldo in onderling gespeelde wedstrijden<br />- Algemeen doelpuntensaldo<br />- Totaal aantal gemaakte doelpunten<br />- Testmatch of loting, indien nodig</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.3</span><span className='block flex-1 text-justify'>Wanneer een ploeg zich terugtrekt of stopt tijdens de competitie, worden alle resterende wedstrijden van die ploeg als forfait (verloren) genoteerd.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.4</span><span className='block flex-1 text-justify'>Indien een ploeg buiten competitie wordt gezet, blijven de punten behaald in een ronde behouden, op voorwaarde dat de ploeg alle wedstrijden in die ronde heeft gespeeld.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.5</span><span className='block flex-1 text-justify'>Alle ploegen worden via loting verdeeld voor de beker en spelen volgens het knock-out systeem. Bij een oneven aantal ploegen schuiven de finalisten van het vorige jaar automatisch een ronde verder. Dezelfde regels als in de competitie zijn van toepassing op de beker. Indien een ploeg niet opdaagt voor een bekerwedstrijd, wordt deze uitgesloten uit de beker, krijgt de tegenstander de overwinning toegekend en wordt een boete opgelegd.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.6</span><span className='block flex-1 text-justify'>Bij gelijkstand in de knock-outfase worden direct strafschoppen genomen (geen verlenging op uitzondering van de bekerfinale). Elke ploeg duidt 5 spelers aan.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>3.7</span><span className='block flex-1 text-justify'>Schorsingen opgelopen in de competitie gelden ook voor bekerwedstrijden en omgekeerd.</span></p>
      </div>
    )
  },
  {
    title: "4. Spelers & Inschrijving",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>4.1</span><span className='block flex-1 text-justify'>Overgangen tussen ploegen tijdens de lopende competitie zijn verboden. Nieuwe spelers aansluiten kan tot net voor de start van de competitie.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>4.2</span><span className='block flex-1 text-justify'>Elke ploeg moet voor de start van de competitie een volledige spelerslijst indienen via het digitaal platform, met alle vereiste gegevens (naam, geboortedatum).</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>4.3</span><span className='block flex-1 text-justify'>De ploeg is verantwoordelijk voor het verzekeren van alle spelers tegen sportongevallen, hetzij via een eigen verzekering, hetzij via een collectieve verzekering. De vereniging is niet verantwoordelijk voor ongevallen of kwetsuren.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>4.4</span><span className='block flex-1 text-justify'>Spelers uit hogere afdelingen dan 1ste Provinciale zijn niet toegestaan.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>4.5</span><span className='block flex-1 text-justify'>Spelers zonder identiteitskaart of rijbewijs kunnen niet deelnemen aan de wedstrijd. Uitzonderlijk kan een digitale identificatie worden toegelaten, mits goedkeuring van de scheidsrechter. Indien een niet-geregistreerde speler toch deelneemt, wordt de forfaitscore uitgesproken en volgt een boete.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>4.6</span><span className='block flex-1 text-justify'>Elke ploeg is verplicht in identieke uitrusting te spelen. De kapitein draagt een armband; indien niet, volgt een boete.</span></p>
      </div>
    )
  },
  {
    title: "5. Disciplinaire Zaken",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.1</span><span className='block flex-1 text-justify'>Gele kaart (boete: €): Speler mag verder spelen.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.2</span><span className='block flex-1 text-justify'>Rode kaart (boete: €): onmiddellijke uitsluiting ZONDER vervanging.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.3</span><span className='block flex-1 text-justify'>Schorsingen na gele kaarten:<br />- 2 gele kaarten: 1 wedstrijd schorsing<br />- 4 gele kaarten: 2 opeenvolgende wedstrijden<br />- 6 gele kaarten: 3 opeenvolgende wedstrijden</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.4</span><span className='block flex-1 text-justify'>Schorsingen na rode kaart:<br />- Minimum schorsing: 1 wedstrijden schorsing<br />- Minnelijke schikking mogelijk, als de sportcomité dit beslist.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.5</span><span className='block flex-1 text-justify'>Het sportcomité kan spelers oproepen. Bij negeren oproeping: minimum 10 wedstrijden schorsing.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.6</span><span className='block flex-1 text-justify'>Forfait heeft een uitslag van 10-0 (boete: €): bij afwezigheid, minder dan 4 spelers, of weigering zaal verlaten. Verwittigd forfait (1 dag vooraf) heeft lagere boete.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>5.7</span><span className='block flex-1 text-justify'>Beroep moet per mail worden ingediend binnen 7 werkdagen na een beslissing.</span></p>
      </div>
    )
  },
  {
    title: "6. Bekercompetitie",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>6.1</span><span className='block flex-1 text-justify'>Alle ploegen worden via loting verdeeld en wordt gespeeld volgens knock-out systeem, bij ongelijke verdeling schuiven de finalisten van vorig jaar een ronde verder.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>6.2</span><span className='block flex-1 text-justify'>Bij gelijkstand in knockoutfase worden direct strafschoppen genomen (geen verlenging). 5 spelers per ploeg.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>6.3</span><span className='block flex-1 text-justify'>Schorsingen in competitie gelden ook voor bekerwedstrijden en vice versa.</span></p>
      </div>
    )
  },
  {
    title: "7. Wedstrijdformulieren",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>7.1</span><span className='block flex-1 text-justify'>Wedstrijdformulier beschikbaar via website. ploegen vullen aan ten laatste 5 min voor tijd in.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>7.2</span><span className='block flex-1 text-justify'>Identiteitsbewijzen verplicht bij wedstrijdblad. Spelers zonder geldig ID kunnen enkel deelnemen mits toelating scheidsrechter.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>7.3</span><span className='block flex-1 text-justify'>Scheidsrechters aangesteld door bestuur. Bij afwezigheid: bezoekende ploeg duidt eerst vervanger aan, anders thuisploeg.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>7.4</span><span className='block flex-1 text-justify'>Forfait bij 8 minuten na officieel aanvangsuur met minder dan 4 spelers. Te late spelers kunnen nog deelnemen mits ID aan scheidsrechter.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>7.5</span><span className='block flex-1 text-justify'>Bal van thuisploeg wordt gebruikt. Schade aan terrein/scorebord melden aan scheidsrechter.</span></p>
      </div>
    )
  },
  {
    title: "8. Slotbepalingen",
    content: (
      <div className="space-y-3">
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'></span><span className='block flex-1 text-justify'></span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>8.1</span><span className='block flex-1 text-justify'>Deelnamesom bestaat uit inschrijvingsgeld en eventuele waarborgsom voor nieuwe ploegen. Bedragen jaarlijks door bestuur bepaald.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>8.2</span><span className='block flex-1 text-justify'>Niet betaalde bedragen ingehouden van waarborgsom. Laattijdige betaling wordt beboet. Aanvang competitie geldt als betalingsdatum.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>8.3</span><span className='block flex-1 text-justify'>Inschrijving tegen door bestuur bepaalde datum. Spelerslijst voor competitiestart indienen met alle vereiste gegevens.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>8.4</span><span className='block flex-1 text-justify'>Klachten binnen 7 dagen bij bestuur. Wijzigingen ploegverantwoordelijken direct melden. Naamsveranderingen enkel in tussenseizoen.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>8.5</span><span className='block flex-1 text-justify'>Sporthalreglement wordt overgenomen. Laatste wedstrijdploegen plaatsen doelen terug in berging.</span></p>
        <p className='pl-6 flex items-start'><span className='min-w-[3.5rem] font-bold flex-shrink-0'>8.6</span><span className='block flex-1 text-justify'>Dit reglement treedt in werking bij goedkeuring bestuur en vervangt alle vorige versies. Bestuur niet verantwoordelijk voor schade door onsportief gedrag.</span></p>
      </div>
    )
  },
];

function ReglementTab() {
  return (
    <Container size="sm" py="xl">
      <Accordion variant="separated" radius="md" defaultValue="">
        {reglement.map((h, i) => (
          <AccordionItem key={h.title} value={h.title}>
            <AccordionControl>
              <Text size="lg" fw={600} c="grape.8">{h.title}</Text>
            </AccordionControl>
            <AccordionPanel>
              {h.content}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  );
}

export default ReglementTab; 