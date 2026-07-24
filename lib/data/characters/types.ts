import type {
  CharacterBase,
  ElementKey,
  WeaponType,
} from "../../calculator.ts";
import type { CharacterDamageProfile } from "../../damage-types.ts";
import type {
  DamageEffect,
  PanelEffect,
} from "../../effects.ts";
import type { TeamBuffDefinition } from "../../team-types.ts";

export type {
  CharacterDamageProfile,
  DamageControl,
  DamageReaction,
} from "../../damage-types.ts";

export type CharacterPreset = CharacterBase & {
  id: string;
  element: ElementKey;
  weaponType: WeaponType;
  defaultWeaponId: string;
  ascensionLabel: string;
  burstEnergyCost?: number;
  panelEffects?: readonly PanelEffect[];
  damageProfile?: CharacterDamageProfile;
  teamBuffs?: readonly TeamBuffDefinition[];
  constellations?: readonly {
    level: number;
    name: string;
    description: string;
    talentLevelBonuses?: Partial<
      Record<"normal" | "skill" | "burst", number>
    >;
    panelEffects?: readonly PanelEffect[];
    damageEffects?: readonly DamageEffect[];
  }[];
};
