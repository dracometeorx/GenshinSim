import type { WeaponPreset } from "./types.ts";

const damagePerStack = [6, 7, 8, 9, 10] as const;

export const serpentSpine: WeaponPreset = {
  id: "serpent-spine",
  name: "螭骨剑",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critRate",
  secondaryValue: 27.6,
  secondaryLabel: "暴击率 +27.6%",
  passive: {
    name: "破浪",
    description:
      "角色在场时每 4 秒获得一层伤害加成，至多五层；受到伤害会损失一层。",
    damageEffects: [
      {
        id: "serpent-spine-stacks",
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const stacks = Math.min(
            5,
            Math.max(
              0,
              Number(weaponSelections.serpentSpineStacks) || 0,
            ),
          );
          return [
            {
              stat: "damageBonus",
              value: damagePerStack[refinementIndex] * stacks,
            },
          ];
        },
      },
    ],
    refinementDescriptions: damagePerStack.map(
      (value) =>
        `每层造成伤害提高 ${value}%，五层时为 ${value * 5}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "serpentSpineStacks",
      label: "螭骨剑层数",
      defaultValue: "5",
      options: [0, 1, 2, 3, 4, 5].map((value) => ({
        value: String(value),
        label: `${value} 层`,
      })),
    },
  },
};
