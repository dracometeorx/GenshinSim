import { customWeapon } from "./custom.ts";
import { deathmatch } from "./deathmatch.ts";
import { dragonsBane } from "./dragons-bane.ts";
import { dreams } from "./dreams.ts";
import { engulfing } from "./engulfing.ts";
import { favoniusLance } from "./favonius-lance.ts";
import { homa } from "./homa.ts";
import { mistsplitter } from "./mistsplitter.ts";
import { theCatch } from "./the-catch.ts";
import { fracturedHalo } from "./fractured-halo.ts";
import { bloodsoakedRuins } from "./bloodsoaked-ruins.ts";
import { nightweaversLookingGlass } from "./nightweavers-looking-glass.ts";
import { reliquaryOfTruth } from "./reliquary-of-truth.ts";
import { nocturnesCurtainCall } from "./nocturnes-curtain-call.ts";
import { lightbearingMoonshard } from "./lightbearing-moonshard.ts";
import { frostboundOath } from "./frostbound-oath.ts";
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
  fracturedHalo,
  bloodsoakedRuins,
  nightweaversLookingGlass,
  reliquaryOfTruth,
  nocturnesCurtainCall,
  lightbearingMoonshard,
  frostboundOath,
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
