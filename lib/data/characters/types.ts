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
  DamageModel,
  DamageReaction,
  LunarReactionType,
} from "../../damage-types.ts";

export type CharacterPreset = CharacterBase & {
  id: string;
  element: ElementKey;
  weaponType: WeaponType;
  defaultWeaponId: string;
  ascensionLabel: string;
  burstEnergyCost?: number;
  /** Characters with this flag contribute one level to the party Moonsign. */
  moonsign?: boolean;
  /** Some characters, such as Columbina, raise the party Moonsign by more. */
  moonsignLevels?: number;
  /**
   * The character has completed Witch's Homework and is a Hexerei character.
   * A party containing at least two such characters enables Hexerei:
   * Secret Rite.
   */
  hexerei?: boolean;
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
