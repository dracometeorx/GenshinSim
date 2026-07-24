import type { WeaponPreset } from "./types.ts";

const damageBonus = [16, 20, 24, 28, 32] as const;
const critRatePerStack = [2, 2.5, 3, 3.5, 4] as const;

export const wolfFang: WeaponPreset = {
  id: "wolf-fang",
  name: "狼牙",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critRate",
  secondaryValue: 27.6,
  secondaryLabel: "暴击率 +27.6%",
  passive: {
    name: "苍狼北风",
    description:
      "战技与爆发伤害提高；对应技能命中后，其暴击率独立叠加至多四层。",
    damageEffects: [
      {
        id: "wolf-fang-skill-burst",
        evaluate: ({
          refinementIndex,
          target,
          weaponSelections,
        }) => {
          if (
            target.category !== "skill" &&
            target.category !== "burst"
          ) {
            return [];
          }
          const stacks = Math.min(
            4,
            Math.max(
              0,
              Number(weaponSelections.wolfFangStacks) || 0,
            ),
          );
          return [
            {
              stat: "damageBonus",
              value: damageBonus[refinementIndex],
            },
            {
              stat: "critRate",
              value: critRatePerStack[refinementIndex] * stacks,
            },
          ];
        },
      },
    ],
    refinementDescriptions: damageBonus.map(
      (value, index) =>
        `战技/爆发伤害提高 ${value}%；每层对应暴击率提高 ${critRatePerStack[index]}%，四层为 ${critRatePerStack[index] * 4}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "wolfFangStacks",
      label: "对应技能暴击层数",
      defaultValue: "4",
      options: [0, 1, 2, 3, 4].map((value) => ({
        value: String(value),
        label: `${value} 层`,
      })),
    },
  },
};
