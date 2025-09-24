import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { TeamPlayer } from "../hooks/useTeamPlayers";

interface PlayerDataRefreshPopupProps {
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  onRefresh: () => Promise<void>;
  teamLabel: string;
}

const PlayerDataRefreshPopup: React.FC<PlayerDataRefreshPopupProps> = ({
  players,
  loading,
  error,
  onRefresh,
  teamLabel
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasShownInitially, setHasShownInitially] = useState(false);

  // Show popup logic: only when players are undefined AND not loading AND not initial load
  useEffect(() => {
    const shouldShowPopup = 
      !loading && 
      (!players || players.length === 0) && 
      hasShownInitially && 
      refreshCount < 3;

    setShowPopup(shouldShowPopup);
  }, [players, loading, hasShownInitially, refreshCount]);

  // Track initial load completion
  useEffect(() => {
    if (!loading && !hasShownInitially) {
      setHasShownInitially(true);
    }
  }, [loading, hasShownInitially]);

  // Hide popup when players load successfully
  useEffect(() => {
    if (players && players.length > 0) {
      setShowPopup(false);
      setRefreshCount(0); // Reset counter on success
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

export default PlayerDataRefreshPopup;