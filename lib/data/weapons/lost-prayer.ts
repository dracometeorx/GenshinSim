import type { WeaponPreset } from "./types.ts";

const bonusPerStack = [8, 10, 12, 14, 16] as const;

export const lostPrayer: WeaponPreset = {
  id: "lost-prayer",
  name: "四风原典",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "critRate",
  secondaryValue: 33.1,
  secondaryLabel: "暴击率 +33.1%",
  passive: {
    name: "无边际的眷顾",
    description:
      "移动速度提高 10%；在场上每 4 秒获得一层元素伤害加成，至多四层。",
    panelEffects: [
      {
        id: "lost-prayer-stacks",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const stacks = Math.min(
            4,
            Math.max(
              0,
              Number(weaponSelections.lostPrayerStacks) || 0,
            ),
          );
          return [
            {
              stat: "elementalDmg",
              value: bonusPerStack[refinementIndex] * stacks,
            },
          ];
        },
      },
    ],
    refinementDescriptions: bonusPerStack.map(
      (value) =>
        `移动速度提高 10%；每层元素伤害提高 ${value}%，四层时为 ${value * 4}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "lostPrayerStacks",
      label: "四风原典层数",
      defaultValue: "4",
      options: [0, 1, 2, 3, 4].map((value) => ({
        value: String(value),
        label: `${value} 层`,
      })),
    },
  },
};
