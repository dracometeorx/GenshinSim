import type { WeaponBase, WeaponType } from "../../calculator.ts";

export type WeaponPreset = WeaponBase & {
  id: string;
  weaponType: WeaponType;
  secondaryLabel: string;
  passive: {
    name: string;
    description: string;
    refinementDescriptions?: [string, string, string, string, string];
    teammateDependent?: boolean;
    control?: {
      key: string;
      label: string;
      options: Array<{ value: string; label: string }>;
      defaultValue: string;
    };
  };
};
