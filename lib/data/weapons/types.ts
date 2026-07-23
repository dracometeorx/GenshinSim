import type { WeaponBase } from "../../calculator.ts";

export type WeaponPreset = WeaponBase & {
  id: string;
  secondaryLabel: string;
  passive: {
    name: string;
    description: string;
    teammateDependent?: boolean;
    control?: {
      key: string;
      label: string;
      options: Array<{ value: string; label: string }>;
      defaultValue: string;
    };
  };
};
