import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { TeamPlayer } from "@/components/pages/admin/matches/hooks/useTeamPlayers";

interface PlayerDataRefreshModalProps {
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  onRefresh: () => Promise<void>;
  teamLabel: string;
}

export const PlayerDataRefreshModal: React.FC<PlayerDataRefreshModalProps> = ({
  players,
  loading,
  error,
  onRefresh,
  teamLabel
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  // Track when loading starts
  useEffect(() => {
    if (loading) {
      setLoadStartTime(Date.now());
    }
  }, [loading]);

  // Show popup logic: only show when there's an actual error OR when players are undefined (not just empty array) after loading completes
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

    // Only show if players is undefined (not just empty array) AND enough time has passed since load started
    // Empty array (players.length === 0) is OK - means team just has no players
    // Undefined means something went wrong
    if (players === undefined && loadStartTime) {
      const timeSinceLoadStart = Date.now() - loadStartTime;
      // Wait at least 2 seconds after loading completes before showing error
      // This prevents showing popup too quickly
      if (timeSinceLoadStart > 2000 && refreshCount < 3) {
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    } else {
      // If players is defined (even if empty array), don't show popup
      setShowPopup(false);
    }
  }, [players, loading, error, loadStartTime, refreshCount]);

  // Hide popup when players load successfully (defined and has data)
  useEffect(() => {
    if (players !== undefined && players.length > 0) {
      setShowPopup(false);
      setRefreshCount(0); // Reset counter on success
      setLoadStartTime(null);
    }
  }, [players]);

  const handleRefresh = async () => {
    if (refreshCount >= 3) return;
    
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
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-800">
                Spelers niet geladen
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Kan spelers voor {teamLabel} niet laden. Probeer opnieuw?
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing || refreshCount >= 3}
                  size="sm"
                  variant="outline"
                  className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Probeer opnieuw
                    </>
                  )}
                </Button>
                <span className="text-xs text-orange-600">
                  {refreshCount}/3
                </span>
              </div>
            </div>
            <Button
              onClick={() => setShowPopup(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-200"
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

