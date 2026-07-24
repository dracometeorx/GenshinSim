import type { WeaponPreset } from "./types.ts";

const damageBonus = [20, 25, 30, 35, 40] as const;

export const theBlackSword: WeaponPreset = {
  id: "the-black-sword",
  name: "黑剑",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critRate",
  secondaryValue: 27.6,
  secondaryLabel: "暴击率 +27.6%",
  passive: {
    name: "正义",
    description:
      "普通攻击与重击伤害提高；暴击后的治疗效果不并入伤害计算。",
    damageEffects: [
      {
        id: "the-black-sword-attacks",
        evaluate: ({ refinementIndex, target }) =>
          target.category === "normal" ||
          target.category === "charged"
            ? [
                {
                  stat: "damageBonus",
                  value: damageBonus[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: damageBonus.map(
      (value) => `普通攻击与重击伤害提高 ${value}%。`,
    ) as [string, string, string, string, string],
  },
};
