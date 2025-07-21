
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../MINIVOETBAL.UI/components/ui/card";
import { Badge } from "../../../MINIVOETBAL.UI/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../MINIVOETBAL.UI/components/ui/table";
import { CalendarIcon, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface GeneratedDate {
  available_date: string;
  is_available: boolean;
  is_cup_date: boolean;
  venue_id?: number;
  venue_name?: string;
  start_time?: string;
  end_time?: string;
}

interface DateGeneratorPreviewProps {
  generatedDates: GeneratedDate[];
  isLoading?: boolean;
}

const DateGeneratorPreview: React.FC<DateGeneratorPreviewProps> = ({ 
  generatedDates, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Speeldagen laden...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (generatedDates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Geen speeldagen gegenereerd. Ga naar de vorige stap om speeldagen te genereren.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group dates by week
  const datesByWeek = generatedDates.reduce((acc, date) => {
    const dateObj = new Date(date.available_date);
    const weekStart = new Date(dateObj);
    weekStart.setDate(dateObj.getDate() - dateObj.getDay() + 1); // Monday
    const weekKey = format(weekStart, "yyyy-MM-dd");
    
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(date);
    return acc;
  }, {} as Record<string, GeneratedDate[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Gegenereerde Speeldagen
          </CardTitle>
          <CardDescription>
            Overzicht van alle beschikbare speeldagen met locaties en tijdsloten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{generatedDates.length}</div>
              <div className="text-sm text-muted-foreground">Totaal beschikbare tijdsloten</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{Object.keys(datesByWeek).length}</div>
              <div className="text-sm text-muted-foreground">Weken</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {new Set(generatedDates.map(d => d.venue_name)).size}
              </div>
              <div className="text-sm text-muted-foreground">Locaties</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(datesByWeek).map(([weekStart, dates]) => (
        <Card key={weekStart}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary text-primary-foreground">
                Week van {format(new Date(weekStart), "d MMMM yyyy", { locale: nl })}
              </Badge>
              <span className="text-lg">{dates.length} tijdsloten</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Dag</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Locatie</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dates.map((date, index) => {
                    const dateObj = new Date(date.available_date);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(dateObj, "dd/MM/yyyy", { locale: nl })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(dateObj, "EEEE", { locale: nl })}
                        </TableCell>
                        <TableCell>
                          {date.start_time && date.end_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {date.start_time} - {date.end_time}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {date.venue_name && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {date.venue_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={date.is_cup_date ? "destructive" : "secondary"}>
                            {date.is_cup_date ? "Beker" : "Competitie"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DateGeneratorPreview;
