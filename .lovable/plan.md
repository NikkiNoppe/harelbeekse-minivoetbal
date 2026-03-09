

## Analyse: "32 kosten toegevoegd" bij openen financiële pagina

### Bevindingen

**1. Er zijn DUPLICATEN aangemaakt — dit is een bug**

De sync heeft 32 records toegevoegd, maar 20 daarvan zijn **duplicaten**. Er bestaan nu records met exact dezelfde combinatie van `match_id + team_id + cost_setting_id` die dubbel voorkomen.

Getroffen wedstrijden:
- **1 play-off wedstrijd** (match 2179, 19 jan 2026) — 4 duplicaten
- **4 bekerwedstrijden** (matches 1280-1283, 23-24 feb 2026) — 16 duplicaten

Totaal: 652 match_cost records voor 158 wedstrijden. Zonder duplicaten zou dat 632 moeten zijn (158 × 2 teams × 2 kosttypes = 632).

**2. Oorzaak: dubbele verificatie-logica in de edge function**

In `sync-all-match-costs/index.ts` zit een bug op regels 150-175. Na het inserten van ontbrekende kosten (`costsToInsert`), controleert de functie OPNIEUW of er kosten ontbreken via een tweede `missingCosts` check. Maar die check gebruikt de **oude** `existingCostsMap` die niet bijgewerkt is na de eerste insert. Hierdoor worden dezelfde kosten **twee keer** ingevoegd.

**3. Waarom waren er überhaupt 12 ontbrekende kosten (de niet-duplicate 32 - 20)?**

De DB-trigger `process_match_financial_costs` zoekt op `category = 'match'`, maar de werkelijke categorie in de `costs` tabel is `'match_cost'`. Dit betekent dat de trigger **nooit werkt** — alle kosten worden uitsluitend door de edge function of de background side effects aangemaakt.

De 12 echte ontbrekende kosten kwamen waarschijnlijk van recente beker- en play-off wedstrijden waar de background side effects (bij formulier submit) gefaald hebben of niet getriggerd zijn.

**4. Scheidsrechterkosten worden altijd aangerekend — ook zonder scheidsrechter**

De edge function kent scheidsrechterkosten toe aan ALLE wedstrijden met scores, ongeacht of er een scheidsrechter was toegewezen (`assigned_referee_id` is `NULL` bij alle getroffen wedstrijden). Dit is mogelijk ongewenst.

### Voorgesteld plan

| # | Actie | Impact |
|---|-------|--------|
| 1 | **Duplicaten opruimen** — Verwijder de 20 dubbele records uit `team_costs` | Data correctie |
| 2 | **Unique constraint toevoegen** — `UNIQUE(match_id, team_id, cost_setting_id)` op `team_costs` om toekomstige duplicaten onmogelijk te maken | Preventie |
| 3 | **Edge function fixen** — Verwijder de redundante tweede `missingCosts` check uit `sync-all-match-costs` | Bug fix |
| 4 | **DB trigger fixen** — Wijzig `process_match_financial_costs` van `category = 'match'` naar `category = 'match_cost'` zodat kosten automatisch correct worden aangemaakt bij submit | Bug fix |
| 5 | **Scheidsrechterkosten conditioneel maken** — Alleen aanrekenen als `assigned_referee_id IS NOT NULL` in de edge function | Bedrijfslogica |
| 6 | **Sync-toast alleen bij problemen tonen** — De "Kosten gesynchroniseerd" melding onderdrukken wanneer alles al correct is, of de sync helemaal verwijderen nu de trigger correct gaat werken | UX |

### Technische details

**Duplicate cleanup SQL:**
```sql
DELETE FROM team_costs
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY match_id, team_id, cost_setting_id 
      ORDER BY id
    ) as rn
    FROM team_costs
  ) sub WHERE rn > 1
);
```

**Unique constraint:**
```sql
ALTER TABLE team_costs 
ADD CONSTRAINT unique_team_match_cost 
UNIQUE (match_id, team_id, cost_setting_id);
```

**Edge function fix:** Verwijder regels 150-175 (de tweede `missingCosts` loop) uit `sync-all-match-costs/index.ts`, en gebruik `ON CONFLICT DO NOTHING` bij de insert.

**Trigger fix:** In `process_match_financial_costs`, wijzig `WHERE name = 'Veldkosten' AND category = 'match'` naar `category = 'match_cost'`.

