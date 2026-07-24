import type { WeaponPreset } from "./types.ts";

const energy = [4, 4.5, 5, 5.5, 6] as const;
const healing = [4, 4.5, 5, 5.5, 6] as const;

export const prototypeAmber: WeaponPreset = {
  id: "prototype-amber",
  name: "试作金珀",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "hpPct",
  secondaryValue: 41.3,
  secondaryLabel: "生命值 +41.3%",
  passive: {
    name: "炊金",
    description:
      "施放元素爆发后恢复装备者能量并治疗全队；本计算器不模拟能量循环与治疗过程。",
    refinementDescriptions: energy.map(
      (value, index) =>
        `爆发后每 2 秒恢复 ${value} 点能量，并为全队恢复 ${healing[index]}% 生命值，持续 6 秒。`,
    ) as [string, string, string, string, string],
    utilityOnly: true,
  },
};
