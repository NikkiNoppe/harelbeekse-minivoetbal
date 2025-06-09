
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const VenuesCard: React.FC = () => {
  // Fetch venues (locations)
  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('venue_id, name, address')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Beschikbare Locaties
        </CardTitle>
        <CardDescription>
          Locaties uit de database waar wedstrijden gespeeld kunnen worden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {venues.map((venue) => (
            <div key={venue.venue_id} className="p-3 border rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <div>
                  <h4 className="font-medium">{venue.name}</h4>
                  <p className="text-sm text-muted-foreground">{venue.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VenuesCard;
