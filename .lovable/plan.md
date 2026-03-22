

## Bug: Scheidsrechter kan spelerslijst niet opslaan

### Oorzaak

De `update_match_with_context` database-functie bevat een expliciete beveiliging die **alle spelersdata strippen** voor referees:

```sql
IF v_role = 'referee' THEN
    UPDATE matches SET
      home_score = ...,
      away_score = ...,
      is_submitted = ...,
      is_locked = ...,
      referee = ...,
      referee_notes = ...
    WHERE matches.match_id = p_match_id;
    -- home_players en away_players worden NIET meegenomen
```

De client stuurt de spelersdata wel mee en de RPC retourneert "succesvol bijgewerkt", maar de spelers worden nooit opgeslagen. Dit is **by design** (zie memory: player-data-persistence-guards) om te voorkomen dat referees per ongeluk spelersdata overschrijven met lege arrays.

Het probleem is dat dit te streng is: een referee die bewust spelers invult zou dit wel moeten kunnen, zolang er geen bestaande spelersdata wordt gewist.

### Oplossing

**Database-migratie: `update_match_with_context` aanpassen**

De referee-branch uitbreiden zodat spelersdata WEL wordt opgeslagen, maar alleen als:
1. De data daadwerkelijk wordt meegegeven in de payload (`p_update_data ? 'home_players'`)
2. De bestaande `prevent_player_data_wipe` trigger beschermt nog steeds tegen het wissen van bestaande data

```sql
-- Referee branch wordt:
IF v_role = 'referee' THEN
    UPDATE matches SET
      home_score = CASE WHEN p_update_data ? 'home_score' THEN (p_update_data->>'home_score')::INTEGER ELSE home_score END,
      away_score = CASE WHEN p_update_data ? 'away_score' THEN (p_update_data->>'away_score')::INTEGER ELSE away_score END,
      is_submitted = CASE WHEN p_update_data ? 'is_submitted' THEN (p_update_data->>'is_submitted')::BOOLEAN ELSE is_submitted END,
      is_locked = CASE WHEN p_update_data ? 'is_locked' THEN (p_update_data->>'is_locked')::BOOLEAN ELSE is_locked END,
      referee = CASE WHEN p_update_data ? 'referee' THEN p_update_data->>'referee' ELSE referee END,
      referee_notes = CASE WHEN p_update_data ? 'referee_notes' THEN p_update_data->>'referee_notes' ELSE referee_notes END,
      home_players = CASE WHEN p_update_data ? 'home_players' THEN (p_update_data->'home_players')::JSONB ELSE home_players END,
      away_players = CASE WHEN p_update_data ? 'away_players' THEN (p_update_data->'away_players')::JSONB ELSE away_players END
    WHERE matches.match_id = p_match_id;
    RETURN QUERY SELECT p_match_id, TRUE, 'Wedstrijd succesvol bijgewerkt'::TEXT;
    RETURN;
END IF;
```

### Beveiliging

De bestaande `prevent_player_data_wipe` trigger blijft actief en voorkomt dat een referee (of iemand anders die geen admin is) een gevulde spelerslijst kan overschrijven met een lege array. Dit is een voldoende veiligheidslaag.

### Impact

- 1 database-migratie (RPC-functie aanpassen)
- Geen frontend-wijzigingen nodig
- Dirty tracking in de frontend zorgt er al voor dat spelersdata alleen wordt meegestuurd als de referee deze daadwerkelijk heeft gewijzigd

