import type { WeaponBase, WeaponType } from "../../calculator.ts";
import type {
  DamageEffect,
  PanelEffect,
} from "../../effects.ts";

export type RefinementValues = [number, number, number, number, number];

export type WeaponPreset = WeaponBase & {
  id: string;
  weaponType: WeaponType;
  secondaryLabel: string;
  passive: {
    name: string;
    description: string;
    panelEffects?: readonly PanelEffect[];
    damageEffects?: readonly DamageEffect[];
    refinementDescriptions?: [string, string, string, string, string];
    teammateDependent?: boolean;
    utilityOnly?: boolean;
    control?: {
      key: string;
      label: string;
      options: Array<{ value: string; label: string }>;
      defaultValue: string;
    };
  };
};
