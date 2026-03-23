

## Fix: Admin berichten worden niet geladen op /admin/notification

### Oorzaak

De `getAllNotifications()` functie in `notificationService.ts` roept `supabase.from('application_settings')` aan **zonder** `withUserContext`. Hierdoor is er geen `app.current_user_role` context ingesteld in de database-sessie.

De RLS-policy "Admins can manage all application settings" controleert `is_admin_user()` → `get_current_user_role() = 'admin'`. Zonder context retourneert dit `''` (lege string), waardoor de query 0 rijen teruggeeft.

De `SELECT`-policies voor `admin_messages` vereisen ook `get_current_user_role()` te zijn ingesteld (`admin`, `player_manager`, of `referee`), dus ook de fallback-policy werkt niet.

### Oplossing

**Bestand:** `src/services/notificationService.ts`

Wrap de query in `getAllNotifications()` met `withUserContext`:

```typescript
async getAllNotifications(): Promise<Notification[]> {
  try {
    const { data, error } = await withUserContext(async () => {
      return await supabase
        .from('application_settings')
        .select('*')
        .eq('setting_category', 'admin_messages')
        .order('created_at', { ascending: false });
    });
    if (error) throw error;
    return transformNotificationData(data || []);
  } catch (error) {
    console.error('Error loading notifications:', error);
    throw new Error('Kon berichten niet laden');
  }
}
```

Dezelfde fix toepassen op `getActiveNotifications()` en `getAllUsers()` — alle queries die afhankelijk zijn van RLS met rolcontrole moeten via `withUserContext` lopen.

### Impact
- 1 bestand: `src/services/notificationService.ts`
- 3 functies wrappen met `withUserContext`: `getAllNotifications`, `getActiveNotifications`, `getAllUsers`

