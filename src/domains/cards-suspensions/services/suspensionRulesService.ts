// Cards & Suspensions Domain - Suspension Rules Service
// Moved from src/services/suspensionRulesService.ts

import { supabase } from "@/integrations/supabase/client";

export interface YellowCardRule {
  card_count: number;
  suspension_matches: number;
  // Legacy fields for backwards compatibility
  min_cards?: number;
  max_cards?: number;
}

export interface RedCardRules {
  default_suspension_matches: number;
  admin_can_modify: boolean;
  max_suspension_matches: number;
}

export interface ResetRules {
  reset_at_season_end: boolean;
  // Legacy field - kept for backwards compat but no longer used
  reset_yellow_cards_after_matches?: number;
}

export interface SuspensionRules {
  yellow_card_rules: YellowCardRule[];
  red_card_rules: RedCardRules;
  reset_rules: ResetRules;
}

// Default fallback rules
const DEFAULT_SUSPENSION_RULES: SuspensionRules = {
  yellow_card_rules: [
    { card_count: 2, suspension_matches: 1 },
    { card_count: 4, suspension_matches: 2 },
    { card_count: 6, suspension_matches: 2 }
  ],
  red_card_rules: {
    default_suspension_matches: 1,
    admin_can_modify: true,
    max_suspension_matches: 5
  },
  reset_rules: {
    reset_at_season_end: true
  }
};

// Convert legacy range-based rules to new card_count format
function normalizeYellowCardRules(rules: any[]): YellowCardRule[] {
  return rules.map(rule => {
    if ('card_count' in rule) {
      return { card_count: rule.card_count, suspension_matches: rule.suspension_matches };
    }
    // Legacy: convert min_cards to card_count
    return { card_count: rule.min_cards, suspension_matches: rule.suspension_matches };
  });
}

class SuspensionRulesService {
  private cachedRules: SuspensionRules | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getSuspensionRules(): Promise<SuspensionRules> {
    if (this.cachedRules && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedRules;
    }

    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('setting_value')
        .eq('setting_category', 'suspension_rules')
        .eq('setting_name', 'default_rules')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn('Failed to fetch suspension rules, using defaults:', error);
        return DEFAULT_SUSPENSION_RULES;
      }

      const rules = data.setting_value as unknown as SuspensionRules;
      
      this.cachedRules = {
        yellow_card_rules: normalizeYellowCardRules(rules.yellow_card_rules || DEFAULT_SUSPENSION_RULES.yellow_card_rules),
        red_card_rules: { ...DEFAULT_SUSPENSION_RULES.red_card_rules, ...rules.red_card_rules },
        reset_rules: { 
          reset_at_season_end: rules.reset_rules?.reset_at_season_end ?? DEFAULT_SUSPENSION_RULES.reset_rules.reset_at_season_end
        }
      };
      
      this.cacheTimestamp = Date.now();
      return this.cachedRules;
    } catch (error) {
      console.error('Error fetching suspension rules:', error);
      return DEFAULT_SUSPENSION_RULES;
    }
  }

  async updateSuspensionRules(rules: SuspensionRules): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('application_settings')
        .update({ 
          setting_value: rules as any,
          updated_at: new Date().toISOString()
        })
        .eq('setting_category', 'suspension_rules')
        .eq('setting_name', 'default_rules');

      if (error) {
        console.error('Failed to update suspension rules:', error);
        return false;
      }

      this.cachedRules = null;
      this.cacheTimestamp = 0;
      
      return true;
    } catch (error) {
      console.error('Error updating suspension rules:', error);
      return false;
    }
  }

  // Calculate suspension matches for yellow cards - exact match on card_count
  calculateYellowCardSuspension(yellowCards: number): number {
    const rules = this.cachedRules?.yellow_card_rules || DEFAULT_SUSPENSION_RULES.yellow_card_rules;
    return this.findSuspensionMatches(yellowCards, rules);
  }

  private findSuspensionMatches(cards: number, rules: YellowCardRule[]): number {
    for (const rule of rules) {
      if (cards === rule.card_count) {
        return rule.suspension_matches;
      }
    }
    return 0;
  }

  clearCache(): void {
    this.cachedRules = null;
    this.cacheTimestamp = 0;
  }
}

export const suspensionRulesService = new SuspensionRulesService();
