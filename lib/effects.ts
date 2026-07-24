import type {
  BuildInput,
  FinalPanel,
  TalentBonuses,
} from "./calculator.ts";
import type { DamageSettings } from "./damage-types.ts";

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
