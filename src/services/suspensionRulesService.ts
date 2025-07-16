import { supabase } from "@/integrations/supabase/client";

export interface YellowCardRule {
  min_cards: number;
  max_cards: number;
  suspension_matches: number;
}

export interface RedCardRules {
  default_suspension_matches: number;
  admin_can_modify: boolean;
  max_suspension_matches: number;
}

export interface ResetRules {
  reset_yellow_cards_after_matches: number;
  reset_at_season_end: boolean;
}

export interface SuspensionRules {
  yellow_card_rules: YellowCardRule[];
  red_card_rules: RedCardRules;
  reset_rules: ResetRules;
}

// Default fallback rules
const DEFAULT_SUSPENSION_RULES: SuspensionRules = {
  yellow_card_rules: [
    { min_cards: 2, max_cards: 3, suspension_matches: 1 },
    { min_cards: 4, max_cards: 5, suspension_matches: 2 },
    { min_cards: 6, max_cards: 999, suspension_matches: 3 }
  ],
  red_card_rules: {
    default_suspension_matches: 1,
    admin_can_modify: true,
    max_suspension_matches: 5
  },
  reset_rules: {
    reset_yellow_cards_after_matches: 10,
    reset_at_season_end: true
  }
};

class SuspensionRulesService {
  private cachedRules: SuspensionRules | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getSuspensionRules(): Promise<SuspensionRules> {
    // Return cached rules if still valid
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
        .maybeSingle();

      if (error || !data) {
        console.warn('Failed to fetch suspension rules, using defaults:', error);
        return DEFAULT_SUSPENSION_RULES;
      }

      const rules = data.setting_value as unknown as SuspensionRules;
      
      // Validate and merge with defaults
      this.cachedRules = {
        yellow_card_rules: rules.yellow_card_rules || DEFAULT_SUSPENSION_RULES.yellow_card_rules,
        red_card_rules: { ...DEFAULT_SUSPENSION_RULES.red_card_rules, ...rules.red_card_rules },
        reset_rules: { ...DEFAULT_SUSPENSION_RULES.reset_rules, ...rules.reset_rules }
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

      // Clear cache to force refresh
      this.cachedRules = null;
      this.cacheTimestamp = 0;
      
      return true;
    } catch (error) {
      console.error('Error updating suspension rules:', error);
      return false;
    }
  }

  // Calculate suspension matches for yellow cards
  calculateYellowCardSuspension(yellowCards: number): number {
    if (!this.cachedRules) {
      // If no cached rules, fetch them synchronously from defaults
      const rules = DEFAULT_SUSPENSION_RULES.yellow_card_rules;
      return this.findSuspensionMatches(yellowCards, rules);
    }

    return this.findSuspensionMatches(yellowCards, this.cachedRules.yellow_card_rules);
  }

  private findSuspensionMatches(cards: number, rules: YellowCardRule[]): number {
    for (const rule of rules) {
      if (cards >= rule.min_cards && cards <= rule.max_cards) {
        return rule.suspension_matches;
      }
    }
    return 0;
  }

  // Clear cache manually
  clearCache(): void {
    this.cachedRules = null;
    this.cacheTimestamp = 0;
  }
}

export const suspensionRulesService = new SuspensionRulesService();