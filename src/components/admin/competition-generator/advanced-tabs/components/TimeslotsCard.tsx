
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TimeslotsCard: React.FC = () => {
  // Fetch venue timeslots
  const { data: venueTimeslots = [] } = useQuery({
    queryKey: ['venue-timeslots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_timeslots')
        .select(`
          timeslot_id,
          day_of_week,
          start_time,
          end_time,
          venues!inner(name)
        `)
        .order('day_of_week, start_time');
      
      if (error) throw error;
      return data;
    }
  });

  const playDays = [
    { value: 1, label: 'Maandag' },
    { value: 2, label: 'Dinsdag' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Beschikbare Speeltijden
        </CardTitle>
        <CardDescription>
          Tijdstippen per locatie en dag uit de database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {playDays.map((day) => {
            const daySlots = venueTimeslots.filter(slot => slot.day_of_week === day.value);
            return (
              <div key={day.value}>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {day.label}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {daySlots.map((slot) => (
                    <div key={slot.timeslot_id} className="p-2 border rounded text-center bg-muted text-sm">
                      <div className="font-medium">{slot.venues.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeslotsCard;
