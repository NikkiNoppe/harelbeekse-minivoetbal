

## Plan: Berichten-systeem herstructureren

### Samenvatting
De huidige twee-systemen aanpak (popup-notificaties + admin berichten) wordt samengevoegd tot één persistent berichten-systeem. Berichten worden aangemaakt door de admin en getoond onder `/profile` → "Berichten". Geen popups meer.

### Wijzigingen

#### 1. Route hernoemen: `/admin/notification-management` → `/admin/notification`

**Bestanden** (9 bestanden, zoek-en-vervang `notification-management` → `notification`):
- `src/config/routes.ts` — route definitie + alle referenties
- `src/App.tsx` — route registratie
- `src/components/pages/admin/AdminDashboard.tsx` — TabsContent value
- `src/components/pages/admin/AdminSidebar.tsx` — sidebar mapping
- `src/components/pages/header/Header.tsx` — menu item key
- `src/components/navigation/admin-quick-sheet.tsx` — quick sheet item
- `src/components/app-layout.tsx` — adminTabs array
- `src/context/TabVisibilityContext.tsx` — visibility check
- `src/components/pages/admin/settings/components/TabVisibilitySettingsUpdated.tsx` — tab visibility settings

#### 2. NotificationPopup verwijderen

- **Verwijder** `src/components/common/NotificationPopup.tsx`
- **Verwijder import/gebruik** uit `src/components/app-layout.tsx`
- **Verwijder import/gebruik** uit `src/components/pages/admin/AdminDashboardLayout.tsx`

#### 3. NotificationService aanpassen

**Bestand**: `src/services/notificationService.ts`
- Verander `setting_category` van `'notifications'` naar `'admin_messages'` voor alle CRUD operaties
- Verwijder `duration` veld uit interfaces en transformatie (niet meer nodig zonder popups)
- Voeg `title` veld toe aan `setting_value` voor een optioneel onderwerp

#### 4. Admin Formulier aanpassen (NotificationPage + NotificationFormModal)

**Bestand**: `src/components/pages/admin/notifications/NotificationPage.tsx`
- Verwijder `duration`-gerelateerde logica
- Category wordt `'admin_messages'` i.p.v. `'notifications'`
- Hernoem UI-labels: "Notificatie" → "Bericht"
- Doelgroep vereenvoudigen: Rollen (teammanagers/scheidsrechters) of individuele gebruikers — geen "teams" als aparte categorie, geen "everyone"

**Bestand**: `src/components/modals/notifications/notification-form-modal.tsx`
- Verwijder `duration` slider/veld
- Verwijder "Iedereen" target mode
- Houd: "Rollen" (alleen `referee` + `player_manager`), "Individuele gebruikers"
- Start/eind-datum verplicht maken (of standaardwaarden instellen)

#### 5. Berichten weergave op /profile verbeteren

**Bestand**: `src/components/pages/user/UserProfilePage.tsx` — `AdminMessageCardContent`

Huidige implementatie haalt alleen `admin_messages` op zonder targeting-filtering. Aanpassen:
- Query haalt alle actieve `admin_messages` op
- **Client-side filtering** op basis van:
  - `start_date` / `end_date` (alleen tonen als vandaag binnen bereik)
  - `target_roles` — match met ingelogde gebruiker's rol
  - `target_users` — match met ingelogde gebruiker's ID
- Toon berichten als kaarten met type-indicatie (info/warning/success/error kleur), bericht tekst en datum
- Verhoog limit van 3 naar 10

#### 6. RLS Policy toevoegen

Er is al een RLS policy "Authenticated users can read admin messages" voor `setting_category = 'admin_messages'`. Deze werkt voor `player_manager` en `referee` rollen. Geen database-wijzigingen nodig — targeting-filtering gebeurt client-side na de RLS-doorgelaten resultaten.

### Technische aanpak (back-end perspectief)

**Efficiëntie**: Eén tabel (`application_settings`) met `setting_category = 'admin_messages'` dient als opslag. Geen nieuwe tabellen nodig. De bestaande RLS policies garanderen dat alleen geauthenticeerde gebruikers met de juiste rol berichten kunnen lezen. Filtering op targeting (welke gebruiker/rol mag dit bericht zien) gebeurt client-side omdat de dataset klein is (< 50 berichten typisch) en de targeting-logica complex is (combinatie van rollen + individuele users + datumbereik).

### Bestanden die wijzigen
1. `src/config/routes.ts`
2. `src/App.tsx`
3. 7 componenten met route-referenties
4. `src/services/notificationService.ts`
5. `src/components/pages/admin/notifications/NotificationPage.tsx`
6. `src/components/modals/notifications/notification-form-modal.tsx`
7. `src/components/pages/user/UserProfilePage.tsx`
8. `src/components/common/NotificationPopup.tsx` (verwijderen)
9. `src/components/app-layout.tsx` (popup import verwijderen)
10. `src/components/pages/admin/AdminDashboardLayout.tsx` (popup import verwijderen)

