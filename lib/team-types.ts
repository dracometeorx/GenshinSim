import type {
  ElementKey,
  FinalPanel,
  TalentBonuses,
} from "./calculator.ts";
import type {
  DamageReaction,
  DamageSettings,
  LunarReactionType,
} from "./damage-types.ts";
import type { PanelEffectStat } from "./effects.ts";

export type TeamBuffSourceKind =
  | "constellation"
  | "character"
  | "weapon"
  | "artifact"
  | "resonance";

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
        | "critRate"
        | "critDmg"
        | "baseDamageMultiplier"
        | "additiveBaseDamage"
        | "lunarBaseDamageBonus"
        | "lunarReactionDamageBonus"
        | "lunarAdditiveBaseDamage"
        | "lunarElevation"
        | "enemyDefenseReduction"
        | "enemyDefenseIgnore"
        | "enemyResistanceReduction";
      value: number;
      category?: keyof TalentBonuses;
      element?: ElementKey;
      reactions?: DamageReaction[];
      lunarReactions?: LunarReactionType[];
    };

export interface TeamBuffEvaluationContext {
  source: {
      characterId: string;
      moonsign: boolean;
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
  };
  party: {
    highestElementalMastery: number;
    elements: readonly ElementKey[];
    moonsignCount: number;
    moonsignLevel: "none" | "nascent" | "ascendant";
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
