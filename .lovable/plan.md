# Playoff-sortering correct maken

## Doel
De rangschikking op `/playoff` (PO1 en PO2) én de onderliggende reguliere standings sorteren volgens het officiële reglement, waarbij voor de eindstand **alle wedstrijden** (reguliere competitie + playoff) samen tellen.

## Officiële tiebreaker-hiërarchie
Bij gelijke punten:
1. Aantal gewonnen wedstrijden
2. Punten in onderlinge wedstrijden
3. Doelsaldo in onderlinge wedstrijden
4. Algemeen doelsaldo
5. Totaal aantal gemaakte doelpunten
6. Testmatch / loting (handmatig — niet geautomatiseerd)

## Huidige situatie (kort)
`src/hooks/usePublicPlayoffData.ts` sorteert:
- Reguliere stand: alleen op `points`
- PO1/PO2: `total_points` → `playoff_goal_diff` (alleen playoff-wedstrijden)

Wins, onderlinge resultaten, totaal goals en het combineren van regulier + playoff voor het algemeen saldo ontbreken.

## Aanpak

### Stap 1 — Gecombineerde statistieken berekenen
In `usePublicPlayoffData.ts`:
- Alle **reguliere** wedstrijden ophalen (`is_cup_match = false`, `is_playoff_match = false`, `is_submitted = true`).
- Alle **playoff**-wedstrijden ophalen (al aanwezig in de hook).
- Per team één gecombineerd statistiek-object opbouwen met: `played`, `wins`, `draws`, `losses`, `points`, `goals_for`, `goals_against`, `goal_diff`.
- Dit vervangt voor de PO-stand het huidige onderscheid `regular_points + playoff_points` qua sortering. De kolommen op het scherm (reguliere pt, playoff pt, totaal) blijven behouden voor weergave.

### Stap 2 — Onderlinge resultaten (head-to-head)
Een generieke comparator schrijven die, bij gelijke punten tussen 2+ teams, een mini-stand maakt over de wedstrijden tussen exact die teams (regulier + playoff samen):
- punten in onderlinge wedstrijden
- doelsaldo in onderlinge wedstrijden

### Stap 3 — Tiebreaker-comparator
Vergelijkingsvolgorde:
1. `points` (DESC)
2. `wins` (DESC)
3. head-to-head punten (DESC) — alleen tussen de nog-gelijke teams
4. head-to-head doelsaldo (DESC)
5. `goal_diff` algemeen (DESC)
6. `goals_for` (DESC)
7. fallback: alfabetisch op teamnaam (stabiel, voorkomt random volgorde; testmatch/loting blijft handmatig)

De comparator wordt toegepast in een "groeperen op gelijke punten → tiebreak binnen groep" patroon, zodat head-to-head correct werkt bij 3+ teams op gelijke punten.

### Stap 4 — Reguliere standings ook correct sorteren
Dezelfde tiebreaker-logica toepassen op de reguliere stand (gebruikt om PO1/PO2 te splitsen op plaats 8/9). Dit kan in dezelfde hook met alleen de reguliere wedstrijden, zodat de splitsing PO1 vs PO2 ook deterministisch en correct is.

### Stap 5 — Verificatie
- Concreet geval De Florre vs MVC De Plakkers in PO2 nakijken: De Florre moet boven De Plakkers staan (meer wins, beter algemeen saldo, meer goals).
- Eventueel admin-pagina playoffs (`AdminPlayoffPage` / `usePlayoffData`) controleren of die dezelfde logica nodig heeft (mock-data hook, waarschijnlijk niet relevant voor productie-stand).

## Bestanden die wijzigen
- `src/hooks/usePublicPlayoffData.ts` — hoofdwijziging: data ophalen reguliere wedstrijden, gecombineerde stats, tiebreaker-comparator, head-to-head helper.
- Geen UI-wijzigingen nodig — `PlayoffTeam`-interface blijft compatibel (eventueel `wins`/`goals_for` toevoegen indien nog niet aanwezig voor sortering).
- Geen database- of RLS-wijzigingen.

## Niet in scope
- Testmatch/loting-afhandeling (blijft handmatig).
- Wijzigen van hoe `competition_standings` in de DB wordt opgebouwd — we sorteren client-side op basis van wedstrijden, wat consistent is met hoe playoff-stats al berekend worden.
