import { memo, useCallback } from "react";
import { CalendarPlus, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadICalFile, downloadCSVFile, type ICalEvent } from "@/lib/icalUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ScheduleMatch {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  time: string;
  location: string;
  matchday?: string;
  uniqueNumber?: string;
}

interface DownloadScheduleButtonProps {
  matches: ScheduleMatch[];
  filename?: string;
  calendarName?: string;
  competitionType?: "competitie" | "playoff";
  className?: string;
}

const matchToICalEvent = (match: ScheduleMatch, competitionType: string): ICalEvent => ({
  id: match.matchId,
  title: `${match.homeTeamName} vs ${match.awayTeamName}`,
  date: match.date,
  time: match.time || "19:00",
  location: match.location || "Harelbekese Minivoetbal",
  description: match.matchday
    ? `${match.matchday} - ${competitionType === "playoff" ? "Play-Off" : "Competitie"}${match.uniqueNumber ? ` (${match.uniqueNumber})` : ""}`
    : undefined,
  duration: 90,
});

const DownloadScheduleButton = memo(({
  matches,
  filename = "speelschema",
  calendarName,
  competitionType = "competitie",
  className = "",
}: DownloadScheduleButtonProps) => {
  const validMatches = matches.filter(
    (m) => m.date && m.homeTeamName && m.awayTeamName,
  );
  const hasMatches = validMatches.length > 0;

  const handleDownloadAgenda = useCallback(() => {
    if (!hasMatches) {
      toast.error("Geen wedstrijden om te downloaden");
      return;
    }

    const events = validMatches.map((m) => matchToICalEvent(m, competitionType));
    const success = downloadICalFile(events, filename, calendarName || "Speelschema");

    if (success) {
      toast.success(
        `${validMatches.length} wedstrijd${validMatches.length === 1 ? "" : "en"} gedownload`,
        { description: "Open het bestand om toe te voegen aan je agenda" },
      );
    } else {
      toast.error("Kon geen agenda bestand aanmaken", {
        description: "Controleer of de wedstrijden geldige datums hebben",
      });
    }
  }, [hasMatches, validMatches, filename, calendarName, competitionType]);

  const handleDownloadExcel = useCallback(() => {
    if (!hasMatches) {
      toast.error("Geen wedstrijden om te downloaden");
      return;
    }

    const events = validMatches.map((m) => matchToICalEvent(m, competitionType));
    const success = downloadCSVFile(events, filename);

    if (success) {
      toast.success(
        `${validMatches.length} wedstrijd${validMatches.length === 1 ? "" : "en"} geëxporteerd`,
        { description: "Open het CSV bestand in Excel" },
      );
    } else {
      toast.error("Kon geen Excel bestand aanmaken", {
        description: "Controleer of de wedstrijden geldige datums hebben",
      });
    }
  }, [hasMatches, validMatches, filename, competitionType]);

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMatches}
                className={cn(
                  "min-h-[44px] min-w-[44px] shrink-0 gap-1.5 px-2 sm:px-3",
                  "text-muted-foreground hover:text-foreground",
                  className,
                )}
                aria-label="Download speelschema"
              >
                <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium sm:hidden">Download</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="hidden sm:block">
            <p>Speelschema downloaden</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-48 bg-popover">
          <DropdownMenuItem
            onClick={handleDownloadAgenda}
            disabled={!hasMatches}
            className="cursor-pointer min-h-[44px]"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Download agenda</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownloadExcel}
            disabled={!hasMatches}
            className="cursor-pointer min-h-[44px]"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Download Excel</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
});

DownloadScheduleButton.displayName = "DownloadScheduleButton";

export default DownloadScheduleButton;
