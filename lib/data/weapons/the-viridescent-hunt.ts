import type { WeaponPreset } from "./types.ts";

const chance = [50, 50, 50, 50, 50] as const;
const cycloneDamage = [40, 50, 60, 70, 80] as const;
const cooldown = [14, 13, 12, 11, 10] as const;

export const theViridescentHunt: WeaponPreset = {
  id: "the-viridescent-hunt",
  name: "苍翠猎弓",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critRate",
  secondaryValue: 27.6,
  secondaryLabel: "暴击率 +27.6%",
  passive: {
    name: "苍翠之风",
    description:
      "普攻与重击命中有概率生成持续吸引敌人的风之眼；独立物理伤害不并入代表技能。",
    refinementDescriptions: cycloneDamage.map(
      (value, index) =>
        `普攻/重击命中有 ${chance[index]}% 概率生成风之眼，每 0.5 秒造成 ${value}% 攻击力物理伤害，冷却 ${cooldown[index]} 秒。`,
    ) as [string, string, string, string, string],
    utilityOnly: true,
  },
};
