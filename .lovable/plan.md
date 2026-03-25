

## Fix: Boetes en Financieel secties tonen dezelfde records maar synchroniseren niet

### Probleem

Beide secties ("Boetes" en "Financieel") laden dezelfde `team_costs` records uit de database, maar beheren aparte lokale state arrays (`savedPenalties` en `matchCosts`). Bij verwijdering in de ene sectie wordt alleen die ene state-array bijgewerkt — de andere toont het record nog steeds.

### Oplossing

Bij elke delete/update in **beide** secties, synchroniseer beide state arrays:

**Bestand:** `src/components/modals/matches/wedstrijdformulier-modal.tsx`

1. **`removeSavedPenalty`** (regel 416): na succesvolle DB-delete, ook `matchCosts` bijwerken:
   ```typescript
   setSavedPenalties(prev => prev.filter((_, i) => i !== index));
   setMatchCosts(prev => prev.filter(c => c.id !== penalty.id));
   ```

2. **`handleDeleteMatchCost`** (regel 232): na succesvolle DB-delete, ook `savedPenalties` bijwerken:
   ```typescript
   setMatchCosts(prev => prev.filter(c => c.id !== costId));
   setSavedPenalties(prev => prev.filter(p => p.id !== costId));
   ```

3. **`handleUpdateMatchCostAmount`** (regel 247): na succesvolle DB-update, ook `savedPenalties` bijwerken als het bedrag veranderd is:
   ```typescript
   setMatchCosts(prev => prev.map(c => c.id === costId ? { ...c, amount: newAmount } : c));
   setSavedPenalties(prev => prev.map(p => p.id === costId ? { ...p, amount: newAmount } : p));
   ```

### Impact
- 1 bestand, 3 kleine wijzigingen
- Geen database-wijzigingen nodig

