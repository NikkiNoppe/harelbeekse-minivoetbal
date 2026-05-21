## Doel

Forfait-mails versturen vanaf `info@harelbekeminivoetbal.be` via de Resend-connector.

## Stap 1 — Domein verifiëren in Resend (jij)

1. Ga naar [resend.com/domains](https://resend.com/domains) en log in op het account dat aan de "HarelbekeMinivoetbal"-connector hangt.
2. Klik **Add Domain** → vul `harelbekeminivoetbal.be` in (root, niet `notify.*`).
3. Resend toont DNS-records:
   - **MX** (voor bounces, bv. `feedback-smtp.eu-west-1.amazonses.com`)
   - **TXT (SPF)** met `v=spf1 include:amazonses.com ~all`
   - **TXT (DKIM)** met een lange `resend._domainkey` waarde
   - Optioneel **DMARC**
4. Voeg deze records toe bij de DNS-provider waar `harelbekeminivoetbal.be` gehost is. **Niet bij Lovable** — die beheert enkel `notify.harelbekeminivoetbal.be`.
5. Klik in Resend op **Verify**. Status moet "Verified" worden (meestal binnen enkele minuten).

⚠️ Belangrijk: zolang het domein niet "Verified" is in Resend, blijven de mails falen met een domain-error. De huidige fallback (`onboarding@resend.dev`) blijft werken tot dat klaar is.

## Stap 2 — Code aanpassing (ik, na jouw bevestiging)

Eén regel in `supabase/functions/send-forfait-notification/index.ts`:

```text
from: "Harelbeekse Minivoetbal <onboarding@resend.dev>"
   ↓
from: "Harelbeekse Minivoetbal <info@harelbekeminivoetbal.be>"
```

Daarna deploy ik de edge function opnieuw.

## Stap 3 — Test

Eén forfait-mail sturen naar jezelf om te bevestigen dat:
- de afzender `info@harelbekeminivoetbal.be` toont
- de mail in de inbox aankomt (niet spam)
- SPF/DKIM checks groen staan in de mail-headers

## Wat je me laat weten

Zeg "klaar" zodra Resend het domein als **Verified** toont — dan pas ik de `from` aan en deploy ik. Als je tijdens de DNS-setup vastloopt op een specifiek record, deel het record en ik help je verder.
