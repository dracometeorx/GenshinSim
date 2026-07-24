import type {
  BuildInput,
  ElementKey,
  FinalPanel,
  TalentBonuses,
} from "./calculator.ts";
import type {
  DamageReaction,
  DamageSettings,
  DamageTarget,
} from "./damage-types.ts";

export type PanelEffectStage = "additive" | "conversion";

export type PanelEffectStat =
  | "hpPct"
  | "atkPct"
  | "defPct"
  | "critRate"
  | "critDmg"
  | "energyRecharge"
  | "elementalMastery"
  | "elementalDmg"
  | "healingBonus"
  | "flatHp"
  | "flatAtk"
  | "flatDef"
  | keyof TalentBonuses;

export interface PanelModifier {
  stat: PanelEffectStat;
  value: number;
}

export interface PanelEffectContext {
  build: BuildInput;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  panel: Readonly<FinalPanel>;
  refinementIndex: number;
  weaponSelections: Readonly<Record<string, string>>;
  damageSelections: Readonly<Record<string, string>>;
  damageSettings: Readonly<DamageSettings>;
}

/**
 * A catalog-owned panel effect. Data modules decide what an effect does;
 * the shared calculator decides when stages run and how modifiers combine.
 */
export interface PanelEffect {
  id: string;
  stage: PanelEffectStage;
  /**
   * Conditional effects are omitted from the static panel and included in
   * the combat panel according to the request's current selections.
   */
  conditional?: boolean;
  evaluate(context: PanelEffectContext): readonly PanelModifier[];
}

export type DamageEffectStat =
  | "damageBonus"
  | "critRate"
  | "critDmg"
  | "baseDamageMultiplier"
  | "enemyDefenseReduction"
  | "enemyDefenseIgnore"
  | "enemyResistanceReduction";

export interface DamageEffectModifier {
  stat: DamageEffectStat;
  value: number;
  category?: keyof TalentBonuses;
  element?: ElementKey;
  reactions?: readonly DamageReaction[];
}

export interface DamageEffectContext {
  build: BuildInput;
  panel: Readonly<FinalPanel>;
  target: Readonly<DamageTarget>;
  settings: Readonly<DamageSettings>;
  refinementIndex: number;
  weaponSelections: Readonly<Record<string, string>>;
}

export interface DamageEffect {
  id: string;
  evaluate(context: DamageEffectContext): readonly DamageEffectModifier[];
}

export function getRefinementIndex(refinement: number) {
  const value = Number.isFinite(refinement)
    ? Math.round(refinement)
    : 1;
  return Math.min(4, Math.max(0, value - 1));
}

export function evaluatePanelEffects(
  effects: readonly PanelEffect[],
  stage: PanelEffectStage,
  includeConditional: boolean,
  context: PanelEffectContext,
) {
  return effects
    .filter(
      (effect) =>
        effect.stage === stage &&
        (includeConditional || !effect.conditional),
    )
    .flatMap((effect) => effect.evaluate(context))
    .filter((modifier) => Number.isFinite(modifier.value));
}

export function evaluateDamageEffects(
  effects: readonly DamageEffect[],
  context: DamageEffectContext,
) {
  return effects
    .flatMap((effect) => effect.evaluate(context))
    .filter((modifier) => Number.isFinite(modifier.value));
}
