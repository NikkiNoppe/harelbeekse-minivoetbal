

## Probleem

`AdminDashboard.tsx` importeert `SettingsPanel` (regel 6) maar gebruikt `SettingsPage` (regel 128) als render component. Daardoor wordt het oude settings component getoond zonder accordion en zonder de Kleuren tab.

## Oplossing

**1 wijziging in `src/components/pages/admin/AdminDashboard.tsx`:**
- Regel 128: Vervang `<SettingsPage />` door `<SettingsPanel />`
- Regel 14: Verwijder de ongebruikte `SettingsPage` import

Dit zorgt ervoor dat het accordion-gebaseerde settings panel wordt gerenderd met alle secties (inclusief Kleuren) standaard ingeklapt.

