/** Eén geblokkeerd speelmoment: veld/locatie niet beschikbaar op een concrete datum. */
export interface SlotUnavailability {
  id: number;
  name: string;
  /** Kalenderdatum YYYY-MM-DD */
  date: string;
  venue_id: number;
  timeslot_id: number;
  is_active: boolean;
  reason?: string;
}
