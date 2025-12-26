import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import MatchesCardIcon from "./MatchesCardIcon";
import { MatchFormData, PlayerSelection } from "../types";
import { Trash2, Plus, X } from "lucide-react";

type TeamKey = "home" | "away";

interface CardItem {
  team: TeamKey | "";
  playerId: number | null;
  cardType: "yellow" | "double_yellow" | "red";
}

interface MatchesRefereeCardsSectionProps {
  match: MatchFormData;
  homeSelections: PlayerSelection[];
  awaySelections: PlayerSelection[];
  onCardChange: (playerId: number, cardType: string) => void;
  canEdit: boolean;
}

const CARD_OPTIONS = [
  { value: "yellow", label: "Geel" },
  { value: "double_yellow", label: "2x Geel" },
  { value: "red", label: "Rood" },
] as const;

const RefereeCardsSection: React.FC<MatchesRefereeCardsSectionProps> = ({ match, homeSelections, awaySelections, onCardChange, canEdit }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<CardItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCards, setSavedCards] = useState<Array<{ team: TeamKey; playerName: string; cardType: string; playerId: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const playersByTeam = useMemo(() => ({
    home: homeSelections.filter(s => s.playerId !== null),
    away: awaySelections.filter(s => s.playerId !== null)
  }), [homeSelections, awaySelections]);

  // Load existing cards from database
  useEffect(() => {
    const loadExistingCards = async () => {
      setIsLoading(true);
      try {
        const existingCards: Array<{ team: TeamKey; playerName: string; cardType: string; playerId: number }> = [];
        
        // Process home team cards
        if (match.homePlayers) {
          for (const player of match.homePlayers) {
            if (player.playerId && player.cardType && player.cardType !== 'none') {
              existingCards.push({
                team: 'home',
                playerName: player.playerName || `Speler #${player.playerId}`,
                cardType: player.cardType,
                playerId: player.playerId
              });
            } 
          }
        }
        
        // Process away team cards
        if (match.awayPlayers) {
          for (const player of match.awayPlayers) {
            if (player.playerId && player.cardType && player.cardType !== 'none') {
              existingCards.push({
                team: 'away',
                playerName: player.playerName || `Speler #${player.playerId}`,
                cardType: player.cardType,
                playerId: player.playerId
              });
            }
          }
        }
        
        setSavedCards(existingCards);
      } catch (error) {
        console.error('Error loading existing cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingCards();
  }, [match.homePlayers, match.awayPlayers]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { team: "", playerId: null, cardType: "yellow" }]);
  }, []);

  const updateItem = useCallback((index: number, field: keyof CardItem, value: any) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value, ...(field === "team" ? { playerId: null } : {}) } : it));
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const saveItems = useCallback(async () => {
    setIsSaving(true);
    try {
      let saved = 0;
      const sessionAdds: Array<{ team: TeamKey; playerName: string; cardType: string; playerId: number }> = [];
      for (const it of items) {
        if (it.team && it.playerId && it.cardType) {
          onCardChange(it.playerId, it.cardType);
          saved++;
          const list = it.team === "home" ? playersByTeam.home : playersByTeam.away;
          const sel = list.find(s => s.playerId === it.playerId);
          sessionAdds.push({ 
            team: it.team as TeamKey, 
            playerName: sel?.playerName || `Speler #${it.playerId}`, 
            cardType: it.cardType,
            playerId: it.playerId
          });
        }
      }
      toast({ title: "Kaarten opgeslagen", description: `${saved} kaart(en) toegevoegd.` });
      setItems([]);
      setSavedCards(prev => [...sessionAdds, ...prev].slice(0, 20));
    } finally {
      setIsSaving(false);
    }
  }, [items, onCardChange, toast]);

  const removeSavedCard = useCallback((index: number) => {
    const cardToRemove = savedCards[index];
    if (cardToRemove?.playerId) {
      // Remove the card from the player by setting it to 'none'
      onCardChange(cardToRemove.playerId, 'none');
    }
    setSavedCards(prev => prev.filter((_, i) => i !== index));
  }, [savedCards, onCardChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        {canEdit && (
          <Button onClick={addItem} className="btn btn--secondary h-8 px-3">
            <Plus className="h-4 w-4 mr-2" />
            Kaart toevoegen
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <div className="relative space-y-3">
          <button
            type="button"
            className="btn--close absolute top-2 right-2 w-3 h-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Sluiten"
            onClick={() => setItems([])}
          >
            <X className="w-2.5 h-2.5" />
          </button>
          {items.map((it, idx) => {
            const teamPlayers = it.team === "home" ? playersByTeam.home : it.team === "away" ? playersByTeam.away : [];
            return (
              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 p-3 border border-border rounded-lg bg-muted">
                <div className="w-full md:w-1/3">
                  <Label className="text-xs">Team</Label>
                  <Select value={it.team} onValueChange={(v) => updateItem(idx, "team", v)} disabled={!canEdit}>
                    <SelectTrigger className="dropdown-login-style h-8 text-sm">
                      <SelectValue placeholder="Selecteer team" />
                    </SelectTrigger>
                    <SelectContent className="dropdown-content-login-style z-50">
                      <SelectItem value="home" className="dropdown-item-login-style">Thuis — {match.homeTeamName}</SelectItem>
                      <SelectItem value="away" className="dropdown-item-login-style">Uit — {match.awayTeamName}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/3">
                  <Label className="text-xs">Speler</Label>
                  <Select value={it.playerId ? String(it.playerId) : undefined} onValueChange={(v) => updateItem(idx, "playerId", parseInt(v))} disabled={!canEdit || !it.team}>
                    <SelectTrigger className="dropdown-login-style h-8 text-sm">
                      <SelectValue placeholder={!it.team ? "Eerst team kiezen" : "Selecteer speler"} />
                    </SelectTrigger>
                    <SelectContent className="dropdown-content-login-style z-50">
                      {teamPlayers.map(sel => (
                        <SelectItem key={sel.playerId!} value={String(sel.playerId!)} className="dropdown-item-login-style">
                          {sel.playerName || `Speler #${sel.playerId}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/3">
                  <Label className="text-xs">Type kaart</Label>
                  <Select value={it.cardType} onValueChange={(v) => updateItem(idx, "cardType", v)} disabled={!canEdit}>
                    <SelectTrigger className="dropdown-login-style h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dropdown-content-login-style z-50">
                      {CARD_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="dropdown-item-login-style">
                          <span className="flex items-center">
                            <MatchesCardIcon type={opt.value as any} />
                            <span className="ml-1">{opt.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inline action buttons removed as requested */}
              </div>
            );
          })}

          <div className="flex justify-end">
            <Button className="btn btn--primary h-8 px-3" onClick={saveItems} disabled={isSaving}>Kaarten opslaan</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-6 text-gray-500 text-sm">Kaarten laden...</div>
      )}

      {!isLoading && items.length === 0 && savedCards.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">Nog geen kaarten toegevoegd</div>
      )}

      {savedCards.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-1">
            {savedCards.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1.5 bg-white">
                <div className="truncate">
                  <span className="font-medium">{c.team === 'home' ? 'Thuis' : 'Uit'}</span>
                  <span className="mx-1">-</span>
                  <span className="truncate inline-block max-w-[13rem] align-middle">{c.playerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <MatchesCardIcon type={c.cardType as any} />
                    <span>{c.cardType === 'yellow' ? 'Geel' : c.cardType === 'double_yellow' ? '2x Geel' : 'Rood'}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeSavedCard(i)}
                    className="btn btn--icon btn--danger"
                    aria-label="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RefereeCardsSection);


