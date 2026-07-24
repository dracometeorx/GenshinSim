import type { WeaponBase, WeaponType } from "../../calculator.ts";

export type RefinementValues = [number, number, number, number, number];

export type WeaponEffect =
  | {
      kind: "elementalDamageByStacks";
      controlKey: string;
      baseBonus: RefinementValues;
      stackBonus: [
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
      ];
    }
  | {
      kind: "hpToAttack";
      controlKey: string;
      activeValue: string;
      hpBonus: RefinementValues;
      baseRatio: RefinementValues;
      activeRatio: RefinementValues;
    }
  | {
      kind: "energyRechargeToAttack";
      controlKey: string;
      activeValue: string;
      activeEnergyRecharge: RefinementValues;
      attackRatio: RefinementValues;
      attackCap: RefinementValues;
    };

export type WeaponPreset = WeaponBase & {
  id: string;
  weaponType: WeaponType;
  secondaryLabel: string;
  passive: {
    name: string;
    description: string;
    effect?: WeaponEffect;
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
