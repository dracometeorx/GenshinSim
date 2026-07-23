import type { WeaponBase } from "../../calculator.ts";

export type WeaponPreset = WeaponBase & {
  id: string;
  secondaryLabel: string;
};
