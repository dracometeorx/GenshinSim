import type {
  CharacterBase,
  ElementKey,
  WeaponType,
} from "../../calculator.ts";
import type { CharacterDamageProfile } from "../../damage-types.ts";
import type { PanelEffect } from "../../effects.ts";

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
  panelEffects?: readonly PanelEffect[];
  damageProfile?: CharacterDamageProfile;
};
