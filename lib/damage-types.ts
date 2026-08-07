import type {
  BuildInput,
  FinalPanel,
  TalentBonuses,
} from "./calculator.ts";

export interface DamageSettings {
  enemyLevel: number;
  enemyResistance: number;
  normalTalentLevel: number;
  skillTalentLevel: number;
  burstTalentLevel: number;
  selections: Record<string, string>;
}

export type DamageReaction = "none" | "vaporize" | "melt" | "spread";

export type LunarReactionType =
  | "lunarCharged"
  | "lunarBloom"
  | "lunarCrystallize";

export type StellarReactionType = "stellarConduct";

export type DamageModel =
  | { kind: "standard" }
  | {
      kind: "directLunar";
      reaction: LunarReactionType;
      /**
       * Talent-sourced Lunar DMG uses a hidden reaction coefficient:
       * Lunar-Charged/Bloom use 3, while Lunar-Crystallize uses 1.6.
       */
      directMultiplier?: number;
    }
  | {
      kind: "directStellar";
      reaction: StellarReactionType;
    };

export type DamageVariantKey =
  | DamageReaction
  | LunarReactionType
  | StellarReactionType;

export interface DamageControl {
  key: string;
  label: string;
  defaultValue: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}

export interface DamageTarget {
  id: string;
  name: string;
  description: string;
  multiplierLabel: string;
  baseDamage: number;
  category: keyof TalentBonuses;
  reactions: DamageReaction[];
  model?: DamageModel;
  /** The element whose resistance applies when it differs from the character. */
  damageElement?: BuildInput["element"];
  extraDamageBonus?: number;
  extraCritRate?: number;
  extraCritDmg?: number;
  extraLunarBaseDamageBonus?: number;
  extraLunarReactionDamageBonus?: number;
  extraLunarAdditiveBaseDamage?: number;
  extraLunarElevation?: number;
  extraStellarBaseDamageBonus?: number;
  extraStellarReactionDamageBonus?: number;
  extraStellarAdditiveBaseDamage?: number;
  extraStellarElevation?: number;
  /**
   * Optional display-only breakdown for multi-hit targets. Segment base damage
   * is used as a weight; the already calculated total is allocated across the
   * segments so buffs and rounding remain consistent with the total result.
   */
  segments?: readonly DamageSegment[];
}

export interface DamageSegment {
  id: string;
  name: string;
  multiplierLabel: string;
  baseDamage: number;
}

export interface CharacterDamageContext {
  build: BuildInput;
  constellation: number;
  moonsignLevel: "none" | "nascent" | "ascendant";
  hexereiSecretRite: boolean;
  stellarConductActive: boolean;
  stellarElementalPower: number;
  panel: FinalPanel;
  settings: DamageSettings;
  selection(key: string): string;
  talentValue(values: readonly number[], talentLevel: number): number;
  clamp(value: number, min: number, max: number): number;
  percent(value: number, digits?: number): string;
}

export interface CharacterDamageProfile {
  kind: string;
  talentLabel: string;
  controls: DamageControl[];
  evaluateTargets(context: CharacterDamageContext): DamageTarget[];
}
