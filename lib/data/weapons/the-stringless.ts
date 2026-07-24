import type { WeaponPreset } from "./types.ts";

const damageBonus = [24, 30, 36, 42, 48] as const;

export const theStringless: WeaponPreset = {
  id: "the-stringless",
  name: "绝弦",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "elementalMastery",
  secondaryValue: 165,
  secondaryLabel: "元素精通 +165",
  passive: {
    name: "无矢之歌",
    description: "元素战技与元素爆发造成的伤害提高。",
    damageEffects: [
      {
        id: "the-stringless-skill-burst",
        evaluate: ({ refinementIndex, target }) =>
          target.category === "skill" ||
          target.category === "burst"
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
      (value) => `元素战技与元素爆发伤害提高 ${value}%。`,
    ) as [string, string, string, string, string],
  },
};
