# Priority Order Fix for Cup Creation

## Problem
Bij het aanmaken van een beker kreeg je niet de juiste priorityOrder. De prioriteitsvolgorde was hardcoded in de code en niet correct verwerkt in de database.

## Solution
Ik heb de volgende wijzigingen doorgevoerd om de priority order correct te verwerken in de database:

### 1. Updated Season Data Structure (`src/config/season2025-2026.json`)
- **Venue_timeslots** nu met `priority` en `venue_name` velden
- **Priority_order** array toegevoegd voor snelle toegang
- Correcte prioriteitsvolgorde:
  1. Dageraad Maandag 20:00 (Priority 1)
  2. Vlasschaard Maandag 20:00 (Priority 2)
  3. Dageraad Dinsdag 19:30 (Priority 3)
  4. Dageraad Maandag 19:00 (Priority 4)
  5. Vlasschaard Maandag 19:00 (Priority 5)
  6. Dageraad Dinsdag 18:30 (Priority 6)
  7. Vlasschaard Dinsdag 18:30 (Priority 7)

### 2. New Priority Order Service (`src/services/priorityOrderService.ts`)
- **Fast loading** met localStorage caching
- **Database-driven** priority order
- **Separate row** voor snelle toegang (`priority_order/fast_access`)
- **Fallback** naar season_data als fast access niet beschikbaar is

### 3. Updated Timeslot Priority Service (`src/services/timeslotPriorityService.ts`)
- **Removed hardcoded** priority order
- **Database-driven** matching
- **Async methods** voor betere performance

### 4. Database Migration (`supabase/migrations/20250116000000_update_priority_order_structure.sql`)
- **Updates venue_timeslots** met priority informatie
- **Adds priority_order** array aan season_data
- **Creates separate row** voor fast access
- **Ensures venues** hebben correcte namen

### 5. Updated Cup Service (`src/services/match/cupService.ts`)
- **Uses new priorityOrderService** in plaats van timeslotPriorityService
- **Database-driven** priority matching
- **Correct venue assignment** voor cup matches

### 6. Updated Competition Services
- **CompetitionService** en **MatchAssignmentUtils** gebruiken nu priorityOrderService
- **Consistent priority handling** across all competition types

## Database Structure

### Application Settings Table
```sql
-- Season data met priority information
setting_category: 'season_data'
setting_name: 'main_config'
setting_value: {
  venues: [...],
  venue_timeslots: [
    {
      timeslot_id: 1,
      venue_id: 1,
      day_of_week: 1,
      start_time: "20:00",
      end_time: "21:00",
      priority: 1,
      venue_name: "Sporthal De Dageraad Harelbeke"
    },
    ...
  ],
  priority_order: [
    {
      priority: 1,
      venue_id: 1,
      day_of_week: 1,
      start_time: "20:00",
      description: "Dageraad Maandag 20:00"
    },
    ...
  ]
}

-- Fast access voor priority order
setting_category: 'priority_order'
setting_name: 'fast_access'
setting_value: [...priority_order_array]
```

## Benefits
1. **Correct priority order** voor cup creation
2. **Fast data loading** met caching
3. **Database-driven** configuratie
4. **Consistent venue assignment** across all competition types
5. **Easy maintenance** - priority order kan aangepast worden in database

## To Apply Changes
1. Start Docker Desktop
2. Run: `npx supabase start`
3. Run: `npx supabase db push`
4. Restart de applicatie

De priority order wordt nu correct verwerkt in de database en venues/timeslots worden correct geladen uit season_data met een aparte row voor snelle toegang. 