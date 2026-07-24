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
  extraDamageBonus?: number;
  extraCritRate?: number;
  extraCritDmg?: number;
}

export interface CharacterDamageContext {
  build: BuildInput;
  constellation: number;
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
