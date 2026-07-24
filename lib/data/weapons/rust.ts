import type { WeaponPreset } from "./types.ts";

const normalBonus = [40, 50, 60, 70, 80] as const;

export const rust: WeaponPreset = {
  id: "rust",
  name: "弓藏",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "atkPct",
  secondaryValue: 41.3,
  secondaryLabel: "攻击力 +41.3%",
  passive: {
    name: "速射弓斗",
    description:
      "普通攻击伤害提高，重击伤害降低 10%。",
    damageEffects: [
      {
        id: "rust-attacks",
        evaluate: ({ refinementIndex, target }) => {
          if (target.category === "normal") {
            return [
              {
                stat: "damageBonus",
                value: normalBonus[refinementIndex],
              },
            ];
          }
          if (target.category === "charged") {
            return [{ stat: "damageBonus", value: -10 }];
          }
          return [];
        },
      },
    ],
    refinementDescriptions: normalBonus.map(
      (value) =>
        `普通攻击伤害提高 ${value}%，重击伤害降低 10%。`,
    ) as [string, string, string, string, string],
  },
};
