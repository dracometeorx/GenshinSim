import type {
  ElementKey,
  FinalPanel,
  TalentBonuses,
} from "./calculator.ts";
import type {
  DamageReaction,
  DamageSettings,
  LunarReactionType,
  StellarReactionType,
} from "./damage-types.ts";
import type { PanelEffectStat } from "./effects.ts";

export type TeamBuffSourceKind =
  | "constellation"
  | "character"
  | "weapon"
  | "artifact"
  | "resonance"
  | "reaction";

export type TeamBuffModifier =
  | {
      kind: "panel";
      stat: PanelEffectStat;
      value: number;
    }
  | {
      kind: "damage";
      stat:
        | "damageBonus"
        | "amplifyingReactionBonus"
        | "critRate"
        | "critDmg"
        | "baseDamageMultiplier"
        | "additiveBaseDamage"
        | "lunarBaseDamageBonus"
        | "lunarReactionDamageBonus"
        | "lunarAdditiveBaseDamage"
        | "lunarElevation"
        | "stellarBaseDamageBonus"
        | "stellarReactionDamageBonus"
        | "stellarAdditiveBaseDamage"
        | "stellarElevation"
        | "enemyDefenseReduction"
        | "enemyDefenseIgnore"
        | "enemyResistanceReduction";
      value: number;
      category?: keyof TalentBonuses;
      element?: ElementKey;
      reactions?: DamageReaction[];
      lunarReactions?: LunarReactionType[];
      stellarReactions?: StellarReactionType[];
    };

export interface TeamBuffEvaluationContext {
  source: {
    characterId: string;
    moonsign: boolean;
    hexerei: boolean;
    stellarConductEnabler?: boolean;
    stellarConductRelated?: boolean;
    constellation: number;
    element: ElementKey;
    panel: Readonly<FinalPanel>;
    settings: Readonly<DamageSettings>;
    weaponRefinement: number;
    weaponSelections: Readonly<Record<string, string>>;
    artifactSelections: Readonly<Record<string, string>>;
  };
  target: {
    characterId: string;
    element: ElementKey;
    burstEnergyCost: number;
    moonsign: boolean;
    hexerei: boolean;
    stellarConductEnabler?: boolean;
    stellarConductRelated?: boolean;
  };
  party: {
    highestElementalMastery: number;
    elements: readonly ElementKey[];
    moonsignCount: number;
    moonsignLevel: "none" | "nascent" | "ascendant";
    hexereiCount: number;
    hexereiSecretRite: boolean;
    stellarConductActive?: boolean;
    stellarConductEnablerCount?: number;
    stellarElementalPower?: number;
  };
}

export interface TeamBuffDefinition {
  id: string;
  name: string;
  description: string;
  /** Effects with the same key do not stack; only one switch is exposed. */
  stackingGroup?: string;
  minConstellation?: number;
  minArtifactPieces?: 2 | 4;
  /** Intrinsic effects stay enabled and are shown as always active. */
  toggleable?: boolean;
  /**
   * Direct fixed-stat party buffs marked here are applied to teammate source
   * panels before stat-sharing talents are evaluated. Percentage-derived
   * sharing effects must not use this flag, which prevents recursive scaling.
   */
  contributesToBuffSourcePanel?: boolean;
  appliesToSelf?: boolean;
  appliesToTeammates?: boolean;
  evaluate(
    context: TeamBuffEvaluationContext,
  ): readonly TeamBuffModifier[];
}

export interface TeamSlotSnapshot {
  characterId: string | null;
  planId: string | null;
}

export interface TeamConfiguration {
  slots: [TeamSlotSnapshot, TeamSlotSnapshot, TeamSlotSnapshot];
  buffToggles: Record<string, boolean>;
}

export interface ResolvedTeamBuff {
  id: string;
  sourceKind: TeamBuffSourceKind;
  sourceName: string;
  name: string;
  description: string;
  toggleable: boolean;
  enabled: boolean;
  modifiers: readonly TeamBuffModifier[];
}

export function createEmptyTeamConfiguration(): TeamConfiguration {
  return {
    slots: [
      { characterId: null, planId: null },
      { characterId: null, planId: null },
      { characterId: null, planId: null },
    ],
    buffToggles: {},
  };
}

export function cloneTeamConfiguration(
  team?: Partial<TeamConfiguration>,
): TeamConfiguration {
  const slots = Array.from({ length: 3 }, (_, index) => {
    const slot = team?.slots?.[index];
    return {
      characterId:
        typeof slot?.characterId === "string"
          ? slot.characterId
          : null,
      planId:
        typeof slot?.planId === "string" ? slot.planId : null,
    };
  }) as TeamConfiguration["slots"];

  return {
    slots,
    buffToggles: { ...(team?.buffToggles ?? {}) },
  };
}
