

## Plan: Forfait-uitzondering voor wedstrijdkosten

### Probleem
Wanneer een forfait wordt uitgesproken, worden er momenteel wedstrijdkosten (veld, scheids, admin) toegepast op beide teams alsof de wedstrijd normaal werd gespeeld. Bij een forfait heeft de wedstrijd niet plaatsgevonden, dus mogen er geen wedstrijdkosten worden aangerekend aan beide teams.

### Hoe een forfait wordt gedetecteerd
Er zijn twee forfait-boetes in de database:
- **Forfait verwittigd** (id: 6, €25)
- **Forfait tijdens de wedstrijd** (id: 25, €15)

Een wedstrijd is een forfait als er een `team_costs` record bestaat met `cost_setting_id` IN (6, 25) voor die `match_id`. Dit is een handmatig toegevoegde boete door de admin.

### Aanpak
De forfait-boete wordt handmatig toegevoegd door de admin. De automatische kosten moeten achteraf gecontroleerd worden: als er een forfait-boete aanwezig is, moeten de wedstrijdkosten NIET worden aangerekend (of verwijderd als ze al bestaan).

### Wijzigingen

**1. Database trigger `process_match_financial_costs` updaten (migration)**

Voeg een forfait-check toe aan het begin van de trigger: als er een forfait-penalty bestaat voor deze match_id, sla de wedstrijdkosten over en verwijder eventueel bestaande wedstrijdkosten.

**2. Edge function `sync-match-costs` updaten**

Na het laden van de wedstrijd, controleer of er forfait-boetes bestaan (`cost_setting_id IN (6, 25)` in `team_costs` voor die match). Zo ja: verwijder bestaande wedstrijdkosten en return early.

**3. Edge function `sync-all-match-costs` updaten**

Zelfde check per wedstrijd in de batch-loop: als er een forfait-boete is, skip de wedstrijd en verwijder eventuele bestaande wedstrijdkosten.

**4. `backgroundSideEffects.ts` - volgorde aanpassen**

Geen codewijziging nodig hier; de edge function handelt de check zelf af. Maar documentatie-opmerking: forfait-boetes worden handmatig toegevoegd, dus de automatische sync zal ze correct detecteren bij volgende runs.

### Technische details

De forfait-check query in de edge functions:
```sql
SELECT COUNT(*) FROM team_costs 
WHERE match_id = $1 AND cost_setting_id IN (6, 25)
```

Als count > 0: skip alle wedstrijdkosten en verwijder eventuele bestaande match_cost records voor die wedstrijd.

In de database trigger wordt dezelfde logica toegevoegd als eerste stap, zodat zelfs bij directe database-updates de regel wordt gerespecteerd.

### Samenvatting
- 1 database migration (trigger update)
- 2 edge function updates (`sync-match-costs`, `sync-all-match-costs`)
- Resultaat: bij forfait geen wedstrijdkosten voor beide teams, alleen de forfait-boete voor het schuldige team

