import type { WeaponBase, WeaponType } from "../../calculator.ts";
import type { PanelEffect } from "../../effects.ts";

export type RefinementValues = [number, number, number, number, number];

export type WeaponPreset = WeaponBase & {
  id: string;
  weaponType: WeaponType;
  secondaryLabel: string;
  passive: {
    name: string;
    description: string;
    panelEffects?: readonly PanelEffect[];
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
