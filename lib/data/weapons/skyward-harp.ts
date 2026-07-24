import type { WeaponPreset } from "./types.ts";

const critDmg = [20, 25, 30, 35, 40] as const;
const procChance = [60, 70, 80, 90, 100] as const;

export const skywardHarp: WeaponPreset = {
  id: "skyward-harp",
  name: "天空之翼",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 674,
  secondaryStat: "critRate",
  secondaryValue: 22.1,
  secondaryLabel: "暴击率 +22.1%",
  passive: {
    name: "回响长天的诗歌",
    description:
      "暴击伤害提高；攻击有概率造成小范围物理伤害，额外物理伤害不并入代表技能。",
    damageEffects: [
      {
        id: "skyward-harp-crit-dmg",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "critDmg",
            value: critDmg[refinementIndex],
          },
        ],
      },
    ],
    refinementDescriptions: critDmg.map(
      (value, index) =>
        `暴击伤害提高 ${value}%；命中时有 ${procChance[index]}% 概率造成物理范围伤害。`,
    ) as [string, string, string, string, string],
  },
};
