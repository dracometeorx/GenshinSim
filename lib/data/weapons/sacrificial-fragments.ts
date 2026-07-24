import type { WeaponPreset } from "./types.ts";

const chance = [40, 50, 60, 70, 80] as const;
const cooldown = [30, 26, 22, 19, 16] as const;

export const sacrificialFragments: WeaponPreset = {
  id: "sacrificial-fragments",
  name: "祭礼残章",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 454,
  secondaryStat: "elementalMastery",
  secondaryValue: 221,
  secondaryLabel: "元素精通 +221",
  passive: {
    name: "气定神闲",
    description:
      "元素战技造成伤害时有概率重置其冷却时间；本计算器不模拟技能次数与循环。",
    refinementDescriptions: chance.map(
      (value, index) =>
        `元素战技造成伤害时有 ${value}% 概率重置冷却，每 ${cooldown[index]} 秒至多触发一次。`,
    ) as [string, string, string, string, string],
    utilityOnly: true,
  },
};
