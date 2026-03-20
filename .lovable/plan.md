

## Diagnose

Het probleem is duidelijk: de preview draait in een **sandboxed iframe** en Safari blokkeert programmatische downloads (`a.click()`) vanuit iframes. De blob wordt correct aangemaakt, maar de browser negeert de download-trigger stilletjes.

De `icalUtils.ts` downloads (agenda/CSV) hebben hetzelfde patroon en werken waarschijnlijk ook niet in de preview, maar dat is niet gemeld.

## Oplossing: Fallback download-link in de toast

In plaats van te vertrouwen op `a.click()` (dat Safari/iframe blokkeert), tonen we een **klikbare download-link** in de success-toast. De gebruiker klikt zelf — dat is altijd toegestaan door de browser.

### Aanpak

**1. `triggerDownload` aanpassen in `UserProfilePage.tsx`**
- Na `a.click()`, bewaar de blob URL tijdelijk in state
- Toon in de toast een `action` element (ToastAction) met een echte `<a href={blobUrl} download={filename}>` link
- Als `a.click()` werkt (niet-iframe), downloadt het direct. Als het faalt, heeft de gebruiker de link in de toast
- Revoke de URL pas na 60 seconden (genoeg tijd om te klikken)

**2. Concrete code-wijzigingen**

In `UserProfilePage.tsx`:
- `triggerDownload` retourneert de blob URL in plaats van void
- In `handleDownloadBackup`: gebruik de geretourneerde URL om een toast te tonen met een download-link als `action`
- Toast tekst: "Backup klaar — klik hier om te downloaden" met een ToastAction die een directe `<a download>` link bevat
- Import `ToastAction` uit `@/components/ui/toast`

**3. Geen nieuwe dependencies of bestanden nodig**

### Technische details

- Safari in iframes blokkeert `a.click()` op programmatisch aangemaakte elementen — dit is browser-beveiligingsbeleid
- Een echte user-click op een `<a download>` link werkt wel, zelfs in een iframe
- De toast `action` prop accepteert een `ToastActionElement` — we vullen dit met een anchor-tag gestyled als button
- Blob URL cleanup wordt uitgesteld naar 60s zodat de link in de toast bruikbaar blijft
- Dit lost ook het JSON-download probleem op (zelfde mechanisme)

