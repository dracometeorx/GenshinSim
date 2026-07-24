import { customWeapon } from "./custom.ts";
import { deathmatch } from "./deathmatch.ts";
import { dragonsBane } from "./dragons-bane.ts";
import { dreams } from "./dreams.ts";
import { engulfing } from "./engulfing.ts";
import { favoniusLance } from "./favonius-lance.ts";
import { homa } from "./homa.ts";
import { mistsplitter } from "./mistsplitter.ts";
import { theCatch } from "./the-catch.ts";
import type { WeaponPreset } from "./types.ts";
import type { WeaponType } from "../../calculator.ts";

export type { WeaponPreset } from "./types.ts";

export const weapons: WeaponPreset[] = [
  mistsplitter,
  homa,
  engulfing,
  theCatch,
  deathmatch,
  dragonsBane,
  favoniusLance,
  dreams,
  customWeapon,
];

export const weaponTypeLabels: Record<WeaponType, string> = {
  sword: "单手剑",
  claymore: "双手剑",
  polearm: "长柄武器",
  bow: "弓",
  catalyst: "法器",
  any: "任意武器",
};

export function isWeaponCompatible(
  characterWeaponType: WeaponType,
  weapon: WeaponPreset,
) {
  return (
    characterWeaponType === "any" ||
    weapon.weaponType === "any" ||
    characterWeaponType === weapon.weaponType
  );
}

export function getCompatibleWeapons(characterWeaponType: WeaponType) {
  return weapons.filter((weapon) =>
    isWeaponCompatible(characterWeaponType, weapon),
  );
}
