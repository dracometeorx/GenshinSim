import type {
  ElementKey,
  TalentBonuses,
} from "../../calculator.ts";
import type { TeamBuffDefinition } from "../../team-types.ts";

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
    };

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
};

export type ArtifactSetPreset = {
  id: string;
  name: string;
  shortName: string;
  twoPiece: ArtifactSetEffect;
  fourPiece: ArtifactSetEffect;
  teamBuffs?: readonly TeamBuffDefinition[];
};
