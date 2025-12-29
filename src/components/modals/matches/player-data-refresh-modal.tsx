import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { TeamPlayer } from "@/components/pages/admin/matches/hooks/useTeamPlayers";

interface PlayerDataRefreshModalProps {
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  onRefresh: () => Promise<void>;
  teamLabel: string;
  /** If true, shows popup for empty arrays (suspected RLS issue) */
  showForEmptyArray?: boolean;
}

export const PlayerDataRefreshModal: React.FC<PlayerDataRefreshModalProps> = ({
  players,
  loading,
  error,
  onRefresh,
  teamLabel,
  showForEmptyArray = false
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const MAX_RETRIES = 5; // Increased from 3 to 5 for slow connections

  // Track when loading starts
  useEffect(() => {
    if (loading) {
      setLoadStartTime(Date.now());
    }
  }, [loading]);

  // Show popup logic: only show when there's an actual error OR when players are undefined/empty after loading completes
  useEffect(() => {
    // Don't show during loading
    if (loading) {
      setShowPopup(false);
      return;
    }

    // Only show if there's an actual error
    if (error) {
      setShowPopup(true);
      return;
    }

    // Show if players is undefined (something went wrong)
    // OR if showForEmptyArray is true and players is empty (possible RLS issue)
    const hasNoPlayers = players === undefined || (showForEmptyArray && Array.isArray(players) && players.length === 0);
    
    if (hasNoPlayers && loadStartTime) {
      const timeSinceLoadStart = Date.now() - loadStartTime;
      // Wait at least 3 seconds after loading completes before showing error
      // This prevents showing popup too quickly
      if (timeSinceLoadStart > 3000 && refreshCount < MAX_RETRIES) {
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    } else {
      // If players is defined and has data, don't show popup
      setShowPopup(false);
    }
  }, [players, loading, error, loadStartTime, refreshCount, showForEmptyArray]);

  // Hide popup when players load successfully (defined and has data)
  useEffect(() => {
    if (players !== undefined && players.length > 0) {
      setShowPopup(false);
      setRefreshCount(0); // Reset counter on success
      setLoadStartTime(null);
    }
  }, [players]);

  const handleRefresh = async () => {
    if (refreshCount >= MAX_RETRIES) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!showPopup) return null;

  return (
    <div className="fixed top-4 right-4 z-[1002] max-w-sm">
      <Card className="border-amber-200 bg-amber-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                Spelers niet geladen
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Kan spelers voor {teamLabel} niet laden. 
                {error?.message?.includes('timeout') && ' Slechte verbinding gedetecteerd.'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing || refreshCount >= MAX_RETRIES}
                  size="sm"
                  variant="outline"
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Opnieuw laden
                    </>
                  )}
                </Button>
                <span className="text-xs text-amber-600">
                  {refreshCount}/{MAX_RETRIES}
                </span>
              </div>
              {refreshCount >= MAX_RETRIES && (
                <p className="text-xs text-amber-600 mt-2">
                  Maximum pogingen bereikt. Controleer je verbinding.
                </p>
              )}
            </div>
            <Button
              onClick={() => setShowPopup(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-200"
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
