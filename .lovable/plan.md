

## Plan: Hardcoded SuperAdmin noodtoegang

### Wat
Een verborgen, hardcoded superadmin-account dat:
- Inlogt met username `SuperAdmin` / `superadmin` / `Superadmin` en wachtwoord `admin1987`
- **Niet** in de database staat
- Volledige admin-leestoegang geeft (read-only modus)
- Voorkomt dat de site onbruikbaar wordt als de echte admin per ongeluk verwijderd wordt

### Aanpak

#### 1. UserRole uitbreiden met `superadmin`
**Bestand**: `src/types/auth.ts`
- Voeg `'superadmin'` toe aan `UserRole` type
- SuperAdmin wordt in de UI behandeld als admin (leestoegang tot alles) maar met een `isSuperAdmin` flag

#### 2. AuthContext uitbreiden
**Bestand**: `src/hooks/useAuth.ts`
- Voeg `isSuperAdmin: boolean` toe aan `AuthContextType`

#### 3. Hardcoded login in AuthProvider
**Bestand**: `src/components/pages/login/AuthProvider.tsx`

Vóór de database RPC-call, check of de username (case-insensitive) `superadmin` is en het wachtwoord overeenkomt met een bcrypt-hash van `admin1987`. Gebruik een simpele timing-safe vergelijking.

De superadmin krijgt:
- `id: -1` (negatief, bestaat nooit in DB)
- `role: 'admin'` (zodat bestaande role-checks werken)
- `username: 'SuperAdmin'`
- Geen database context wordt ingesteld (geen RPC calls)
- Een speciale flag `_isSuperAdmin: true` op het user object

#### 4. Read-only modus voor SuperAdmin
**Bestand**: `src/hooks/useAuth.ts` + key admin componenten

- `AuthContextType` krijgt `isSuperAdmin` boolean
- AuthProvider zet dit op `true` wanneer de hardcoded login matcht
- Admin pagina's die mutaties doen (CRUD knoppen, formulieren) worden disabled wanneer `isSuperAdmin === true`
- Een subtiele banner bovenaan het admin panel: "Noodtoegang — alleen-lezen modus"

#### 5. Wachtwoord hash
Het wachtwoord `admin1987` wordt opgeslagen als bcrypt hash string direct in de code. Aangezien we geen bcrypt in de browser hebben, gebruiken we een eenvoudige SHA-256 hash vergelijking via de Web Crypto API (of een hardcoded constant die we vergelijken). Dit is voldoende omdat:
- Het account staat niet in de DB
- Het is een noodmechanisme, niet de primaire auth

### Bestanden die wijzigen
1. `src/types/auth.ts` — `isSuperAdmin` property toevoegen aan `User`
2. `src/hooks/useAuth.ts` — `isSuperAdmin` in context
3. `src/components/pages/login/AuthProvider.tsx` — hardcoded login check vóór DB call
4. `src/components/pages/admin/AdminPanel.tsx` — read-only banner + disable mutaties
5. `src/components/pages/admin/AdminDashboardLayout.tsx` — read-only indicator

### Beveiligingsnotities
- Wachtwoord wordt als SHA-256 hash opgeslagen, niet als plaintext
- SuperAdmin kan geen data wijzigen (UI blokkeert mutaties)
- Geen database context = geen RLS bypass mogelijk
- Console logs worden onderdrukt voor superadmin login

