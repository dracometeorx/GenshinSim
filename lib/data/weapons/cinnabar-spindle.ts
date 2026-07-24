import type { WeaponPreset } from "./types.ts";

const defenseScaling = [40, 50, 60, 70, 80] as const;

export const cinnabarSpindle: WeaponPreset = {
  id: "cinnabar-spindle",
  name: "辰砂之纺锤",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 454,
  secondaryStat: "defPct",
  secondaryValue: 69,
  secondaryLabel: "防御力 +69.0%",
  passive: {
    name: "无垢之心",
    description:
      "元素战技伤害获得基于装备者防御力的附加基础伤害。",
    damageEffects: [
      {
        id: "cinnabar-spindle-skill",
        evaluate: ({ refinementIndex, panel, target }) =>
          target.category === "skill"
            ? [
                {
                  stat: "additiveBaseDamage",
                  value:
                    panel.def *
                    (defenseScaling[refinementIndex] / 100),
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: defenseScaling.map(
      (value) =>
        `元素战技获得相当于防御力 ${value}% 的附加基础伤害。`,
    ) as [string, string, string, string, string],
  },
};
