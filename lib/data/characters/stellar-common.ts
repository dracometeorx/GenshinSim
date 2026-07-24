import type {
  DamageControl,
  DamageModel,
} from "../../damage-types.ts";
import {
  talentCurve,
  talentValueAt,
} from "./lunar-common.ts";

export const stellarConductControls: DamageControl[] = [
  {
    key: "stellarElementalPower",
    label: "星极场元素力",
    defaultValue: "12",
    options: Array.from({ length: 13 }, (_, value) => ({
      value: String(value),
      label:
        value === 0
          ? "0 · 反应系数 1.00"
          : `${value} · 反应系数 ${(1.4 + value * 0.05).toFixed(2)}`,
    })),
  },
];

export function directStellarModel(): DamageModel {
  return {
    kind: "directStellar",
    reaction: "stellarConduct",
  };
}

export function stellarBaseBonusFromAtk(atk: number) {
  return Math.min(14, (Math.max(0, atk) / 100) * 0.7);
}

export { talentCurve, talentValueAt };
