import type { WeaponPreset } from "./types.ts";

const chance = [60, 70, 80, 90, 100] as const;
const cooldown = [12, 10.5, 9, 7.5, 6] as const;

export const favoniusSword: WeaponPreset = {
  id: "favonius-sword",
  name: "西风剑",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 454,
  secondaryStat: "energyRecharge",
  secondaryValue: 61.3,
  secondaryLabel: "元素充能效率 +61.3%",
  passive: {
    name: "顺风而行",
    description:
      "暴击时有概率产生元素微粒；本计算器不模拟产球与循环。",
    refinementDescriptions: chance.map(
      (value, index) =>
        `暴击时有 ${value}% 概率产生元素微粒，每 ${cooldown[index]} 秒至多触发一次。`,
    ) as [string, string, string, string, string],
    utilityOnly: true,
  },
};
