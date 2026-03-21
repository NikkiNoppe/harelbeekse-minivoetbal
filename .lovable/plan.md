

## Fix: subtielere melding bij geen scheidsrechter toegewezen

### Probleem

Bij een toekomstige wedstrijd zonder toegewezen scheidsrechter toont het formulier de `InlinePlayerRetry` banner met "Geen scheidsrechters gevonden" en een "Opnieuw" knop. Dit is misleidend — er is geen fout, er is simpelweg nog geen scheidsrechter aangewezen.

### Oplossing

**Bestand: `src/components/modals/matches/wedstrijdformulier-modal.tsx` (regel 2066-2074)**

Twee scenario's onderscheiden:

1. **Er is een echte fout** (`refereesError` is truthy) → toon de huidige `InlinePlayerRetry` met retry-knop
2. **Geen fout, gewoon lege lijst en geen scheidsrechter geselecteerd** → toon een subtiele informatieve tekst: "Nog geen scheidsrechter toegewezen" (zonder retry-knop)

```tsx
// Vervang regels 2066-2074:
{!loadingReferees && memoizedReferees.length === 0 && !selectedReferee && (
  refereesError ? (
    <InlinePlayerRetry
      onRetry={async () => { await refetchReferees(); }}
      isLoading={loadingReferees}
      error={refereesError}
      itemCount={memoizedReferees.length}
      emptyMessage="Geen scheidsrechters gevonden"
      className="mt-2"
    />
  ) : (
    <p className="text-xs text-muted-foreground mt-2">
      Nog geen scheidsrechter toegewezen
    </p>
  )
)}
```

Eén wijziging, ~10 regels, geen nieuwe bestanden of dependencies.

