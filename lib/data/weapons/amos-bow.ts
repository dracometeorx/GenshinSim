import type { WeaponPreset } from "./types.ts";

const baseBonus = [12, 15, 18, 21, 24] as const;
const flightBonusPerStack = [8, 10, 12, 14, 16] as const;

export const amosBow: WeaponPreset = {
  id: "amos-bow",
  name: "阿莫斯之弓",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "atkPct",
  secondaryValue: 49.6,
  secondaryLabel: "攻击力 +49.6%",
  passive: {
    name: "矢志不忘",
    description:
      "普攻与重击伤害提高；箭矢发射后每经过 0.1 秒进一步提高伤害，至多五层。",
    damageEffects: [
      {
        id: "amos-bow-flight",
        evaluate: ({
          refinementIndex,
          target,
          weaponSelections,
        }) => {
          if (
            target.category !== "normal" &&
            target.category !== "charged"
          ) {
            return [];
          }
          const stacks = Math.min(
            5,
            Math.max(
              0,
              Number(weaponSelections.amosFlightStacks) || 0,
            ),
          );
          return [
            {
              stat: "damageBonus",
              value:
                baseBonus[refinementIndex] +
                flightBonusPerStack[refinementIndex] * stacks,
            },
          ];
        },
      },
    ],
    refinementDescriptions: baseBonus.map(
      (value, index) =>
        `普攻/重击伤害提高 ${value}%；飞行每层额外提高 ${flightBonusPerStack[index]}%，五层合计额外 ${flightBonusPerStack[index] * 5}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "amosFlightStacks",
      label: "箭矢飞行层数",
      defaultValue: "5",
      options: [0, 1, 2, 3, 4, 5].map((value) => ({
        value: String(value),
        label: `${value} 层`,
      })),
    },
  },
};
