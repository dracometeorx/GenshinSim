import type {
  ElementKey,
  TalentBonuses,
} from "../../calculator.ts";
import type { TeamBuffDefinition } from "../../team-types.ts";
import type {
  LunarReactionType,
  StellarReactionType,
} from "../../damage-types.ts";

export type ArtifactElementKey = ElementKey;

export type ArtifactPanelStat =
  | "hpPct"
  | "atkPct"
  | "defPct"
  | "critRate"
  | "critDmg"
  | "energyRecharge"
  | "elementalMastery"
  | "elementalDmg"
  | "healingBonus"
  | "skill"
  | "burst"
  | "normal"
  | "charged"
  | "plunge";

export type ArtifactModifier =
  | {
      kind: "stat";
      stat: ArtifactPanelStat;
      value: number;
      element?: ArtifactElementKey;
    }
  | {
      kind: "damageBonus";
      value: number;
      element?: ArtifactElementKey;
      category?: keyof TalentBonuses;
    }
  | {
      kind: "reactionBonus";
      value: number;
      reactions: Array<"vaporize" | "melt">;
    }
  | {
      kind: "burstFromEnergyRecharge";
      ratio: number;
      max: number;
    }
  | {
      kind: "enemyResistanceReduction";
      value: number;
      element: ArtifactElementKey;
    }
  | {
      kind: "lunarDamageBonus";
      value: number;
      lunarReactions?: LunarReactionType[];
    }
  | {
      kind: "stellarDamageBonus";
      value: number;
      stellarReactions?: StellarReactionType[];
    };

export type ArtifactMoonsignLevel = "none" | "nascent" | "ascendant";

export interface ArtifactModifierContext {
  moonsignLevel: ArtifactMoonsignLevel;
  witchHomeworkCompleted: boolean;
  hexereiSecretRite: boolean;
  characterElement: ElementKey;
  selections: Readonly<Record<string, string>>;
}

export type ArtifactEffectControl = {
  key: string;
  label: string;
  defaultValue: string;
  options: Array<{
    value: string;
    label: string;
    modifiers?: ArtifactModifier[];
  }>;
};

export type ArtifactSetEffect = {
  description: string;
  modifiers?: ArtifactModifier[];
  control?: ArtifactEffectControl;
  panelNote?: string;
  evaluateModifiers?(
    context: ArtifactModifierContext,
  ): readonly ArtifactModifier[];
};

export type ArtifactSetPreset = {
  id: string;
  name: string;
  shortName: string;
  twoPiece: ArtifactSetEffect;
  fourPiece: ArtifactSetEffect;
  teamBuffs?: readonly TeamBuffDefinition[];
};
