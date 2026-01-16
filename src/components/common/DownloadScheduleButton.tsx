import { memo, useCallback } from "react";
import { CalendarPlus, Download, Share2 } from "lucide-react";
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
import { downloadICalFile, shareICalFile, type ICalEvent } from "@/lib/icalUtils";
import { toast } from "sonner";

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

/**
 * Converts match data to iCal event format
 */
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

/**
 * Subtle download button for schedule export
 * Supports iCal download and native sharing on mobile
 */
const DownloadScheduleButton = memo(({ 
  matches, 
  filename = "speelschema",
  calendarName,
  competitionType = "competitie",
  className = ""
}: DownloadScheduleButtonProps) => {
  
  // Filter out matches without valid dates
  const validMatches = matches.filter(m => m.date && m.homeTeamName && m.awayTeamName);
  
  const handleDownload = useCallback(() => {
    if (validMatches.length === 0) {
      toast.error("Geen wedstrijden om te downloaden");
      return;
    }
    
    const events = validMatches.map(m => matchToICalEvent(m, competitionType));
    downloadICalFile(events, filename, calendarName || "Speelschema");
    
    toast.success(`${validMatches.length} wedstrijd${validMatches.length === 1 ? '' : 'en'} gedownload`, {
      description: "Open het .ics bestand om toe te voegen aan je agenda"
    });
  }, [validMatches, filename, calendarName, competitionType]);
  
  const handleShare = useCallback(async () => {
    if (validMatches.length === 0) {
      toast.error("Geen wedstrijden om te delen");
      return;
    }
    
    const events = validMatches.map(m => matchToICalEvent(m, competitionType));
    const shared = await shareICalFile(events, filename, calendarName || "Speelschema");
    
    if (shared) {
      toast.success("Speelschema klaar om te delen");
    }
  }, [validMatches, filename, calendarName, competitionType]);
  
  // Don't render if no valid matches
  if (validMatches.length === 0) {
    return null;
  }
  
  // Check if native sharing is available
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  
  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-9 w-9 text-muted-foreground hover:text-foreground ${className}`}
                aria-label="Download speelschema"
              >
                <CalendarPlus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Speelschema downloaden</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            <span>Download iCal</span>
          </DropdownMenuItem>
          
          {canShare && (
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
              <Share2 className="mr-2 h-4 w-4" />
              <span>Deel via...</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
});

DownloadScheduleButton.displayName = "DownloadScheduleButton";

export default DownloadScheduleButton;
