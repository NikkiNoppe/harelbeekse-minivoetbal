# Send Password Reset Edge Function

Deze Supabase Edge Function handelt wachtwoord reset verzoeken af via email.

## Setup

### Vereisten
- Deno runtime
- VS Code met Deno extension
- Supabase CLI

### Configuratie
Deze Edge Function gebruikt de volgende configuratie bestanden:

- `deno.jsonc` - Deno runtime configuratie
- `tsconfig.json` - TypeScript configuratie
- `.vscode/settings.json` - VS Code instellingen voor Deno

### Environment Variables
Zorg dat de volgende environment variables zijn ingesteld in je Supabase project:

```bash
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Development
```bash
# Start development server
deno task dev

# Deploy naar Supabase
supabase functions deploy send-password-reset
```

## Functionaliteit

1. **Email Validatie** - Controleert of het email adres bestaat
2. **Gebruiker Check** - Verifieert of de gebruiker een email adres heeft
3. **Admin Notificatie** - Stuurt notificatie naar admin als gebruiker geen email heeft
4. **Secure Token** - Genereert veilige reset tokens met 1 uur geldigheid
5. **Email Template** - Stuurt professionele reset emails via Resend

## TypeScript Support

De Edge Function is volledig geconfigureerd voor TypeScript met:
- Deno runtime types
- Externe module imports (Resend, Supabase)
- Strict type checking
- Proper error handling 