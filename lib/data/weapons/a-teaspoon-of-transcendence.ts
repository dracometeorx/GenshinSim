import type { WeaponPreset } from "./types.ts";

const attackPercent = [28, 35, 42, 49, 56] as const;
const stellarPerStack = [16, 20, 24, 28, 32] as const;

export const aTeaspoonOfTranscendence: WeaponPreset = {
  id: "a-teaspoon-of-transcendence",
  name: "超越之匙",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 674,
  secondaryStat: "critDmg",
  secondaryValue: 44.1,
  secondaryLabel: "暴击伤害 +44.1%",
  passive: {
    name: "超越的茶匙",
    description:
      "攻击力提高；重击命中后提高星反应伤害，持续 5 秒，最多叠加 3 层。",
    panelEffects: [
      {
        id: "a-teaspoon-of-transcendence-atk",
        stage: "additive",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "atkPct",
            value: attackPercent[refinementIndex],
          },
        ],
      },
    ],
    damageEffects: [
      {
        id: "a-teaspoon-of-transcendence-stellar",
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const rawStacks = Number(
            weaponSelections.transcendenceStacks ?? "3",
          );
          const stacks = Math.min(
            3,
            Math.max(
              0,
              Number.isFinite(rawStacks) ? Math.round(rawStacks) : 3,
            ),
          );
          return stacks
            ? [
                {
                  stat: "stellarReactionDamageBonus",
                  value: stellarPerStack[refinementIndex] * stacks,
                  stellarReactions: ["stellarConduct"],
                },
              ]
            : [];
        },
      },
    ],
    refinementDescriptions: attackPercent.map(
      (value, index) =>
        `攻击力提高 ${value}%；重击命中后星反应伤害提高 ${stellarPerStack[index]}%，最多叠加 3 层。`,
    ) as [string, string, string, string, string],
    control: {
      key: "transcendenceStacks",
      label: "超越之匙层数",
      defaultValue: "3",
      options: [0, 1, 2, 3].map((value) => ({
        value: String(value),
        label: `${value} 层`,
      })),
    },
  },
};
