

## Administratiekost toevoegen (€1,00 per team per wedstrijd)

### Wat er gebeurt

Een nieuw kostentype "Administratiekosten" (€1,00) wordt toegevoegd dat automatisch bij elke gespeelde wedstrijd wordt aangerekend aan beide teams — net zoals Veldkosten en Scheidsrechterkosten.

### Wijzigingen

| # | Wat | Hoe |
|---|-----|-----|
| 1 | **Nieuw kostenrecord in DB** | `INSERT INTO costs` met naam "Administratiekosten", bedrag €1,00, categorie `match_cost` |
| 2 | **DB trigger updaten** | `process_match_financial_costs()` aanpassen om ook administratiekosten in te voegen bij elke submitted wedstrijd (altijd, net als veldkosten) |
| 3 | **Edge function updaten** | `sync-all-match-costs/index.ts` — administratiekosten toevoegen aan de sync-logica, altijd per team per wedstrijd |
| 4 | **Financieel overzicht updaten** | `FinancialPage.tsx` — apart veld "Admin" toevoegen in de team-kaarten grid (naast Veld, Scheids, Boetes) |
| 5 | **Balance berekening** | `calculateTeamFinances()` aanpassen om administratiekosten mee te tellen in het saldo |
| 6 | **Historische data syncen** | Bij eerste bezoek aan de financiële pagina zal de edge function automatisch de ontbrekende administratiekosten voor alle bestaande wedstrijden toevoegen |

### Technisch

**DB trigger** — nieuwe lookup:
```sql
SELECT id INTO admin_cost_id FROM public.costs 
WHERE name = 'Administratiekosten' AND category = 'match_cost' AND is_active = true LIMIT 1;
```
Wordt altijd ingevoegd (net als veldkosten), ongeacht of er een scheidsrechter is.

**FinancialPage kaarten** — grid wordt 4 kolommen: Veld | Scheids | Admin | Boetes

