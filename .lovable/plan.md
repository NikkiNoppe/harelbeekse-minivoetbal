
Doel: de CSV-backup moet effectief als bestand landen op het toestel, niet enkel toast tonen.

1) Probleem exact afbakenen (snelle diagnose)
- Bevestigen via bestaande code + replay dat de app wel blobs en `<a download>` links maakt, maar dat de browser de automatische multi-download blokkeert (typisch bij meerdere bestanden vanuit script/iframe).
- Gevolg: “Backup gedownload” toast is momenteel misleidend, want die zegt “gelukt” zonder echte bestandsbevestiging.

2) Exportstrategie robuust maken (1 download i.p.v. 13 losse)
- CSV-optie omzetten naar: één ZIP-bestand met per tabel een aparte CSV erin (`backup_YYYY-MM-DD_csv.zip`).
- Dit behoudt “CSV per tabel”, maar vermijdt browserblokkering van meerdere downloads.
- JSON blijft één bestand zoals nu.

3) Implementatie-aanpak in code
- `src/components/pages/user/UserProfilePage.tsx`
  - `handleDownloadBackup('csv')` refactoren: geen loop met 13 `triggerDownload` calls meer.
  - CSV-content per tabel blijven genereren zoals nu (zelfde delimiter/BOM/escaping), maar in ZIP bundelen.
  - Toasttekst aanpassen naar iets als: “Backupbestand aangemaakt” + exacte bestandsnaam.
- Nieuwe utility toevoegen (bv. `src/lib/backupExportUtils.ts`)
  - Helpers:
    - `rowsToCsv(rows)` (herbruikbare CSV-conversie)
    - `buildCsvZip(files)` (zip generatie)
- Dependency toevoegen voor ZIP-opbouw (lichte browser-lib, bv. `fflate`), zodat dit volledig client-side blijft.

4) Betere fallback + UX bij blokkade
- `triggerDownload` uitbreiden met fallback:
  - indien download faalt/blokkeert: tijdelijke “klik hier om te downloaden” link tonen in UI (manuele user-klik werkt vrijwel altijd).
- Backup-knop tijdelijk disablen tijdens export (bestaat al), maar duidelijke status tonen (“ZIP wordt opgebouwd…” bij veel rijen).

5) Validatie (end-to-end)
- Test als admin op `/profile`:
  - JSON: 1 effectief bestand.
  - CSV: 1 ZIP effectief bestand met meerdere CSV’s binnenin.
- Test in preview én published URL (iframe/popup-policy verschillen).
- Controle dat bestandsnaam, rijaantallen en tabelinhoud overeenkomen met toast/metadata.

Technische details
- Root cause in huidige code: CSV-pad triggert meerdere `a.click()` acties na async fetch, waardoor browsers dit als ongewenste automatische downloads kunnen blokkeren.
- Door één ZIP-download te gebruiken, blijft het binnen één expliciete user-actie en is dit browser-compatibeler.
- Geen backend of Supabase schemawijziging nodig; enkel frontend export-flow + utility + dependency.
