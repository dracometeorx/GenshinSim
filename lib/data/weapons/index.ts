import { customWeapon } from "./custom.ts";
import { dreams } from "./dreams.ts";
import { engulfing } from "./engulfing.ts";
import { homa } from "./homa.ts";
import { mistsplitter } from "./mistsplitter.ts";
import type { WeaponPreset } from "./types.ts";

export type { WeaponPreset } from "./types.ts";

export const weapons: WeaponPreset[] = [
  mistsplitter,
  homa,
  engulfing,
  dreams,
  customWeapon,
];
