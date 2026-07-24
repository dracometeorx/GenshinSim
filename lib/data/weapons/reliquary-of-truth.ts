import type { WeaponPreset } from "./types.ts";

const critRate = [8, 10, 12, 14, 16] as const;
const elementalMastery = [80, 100, 120, 140, 160] as const;
const critDmg = [24, 30, 36, 42, 48] as const;

export const reliquaryOfTruth: WeaponPreset = {
  id: "reliquary-of-truth",
  name: "真语秘匣",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "critDmg",
  secondaryValue: 88.2,
  secondaryLabel: "暴击伤害 +88.2%",
  passive: {
    name: "谎言与真理",
    description:
      "提高暴击率；施放战技后提高元素精通，造成月绽放伤害后提高暴击伤害，两种状态同时存在时效果提高 50%。",
    panelEffects: [
      {
        id: "reliquary-of-truth-stats",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const active =
            weaponSelections.reliquaryOfTruthState !== "inactive";
          return [
            { stat: "critRate", value: critRate[refinementIndex] },
            ...(active
              ? [
                  {
                    stat: "elementalMastery" as const,
                    value: elementalMastery[refinementIndex] * 1.5,
                  },
                ]
              : []),
          ];
        },
      },
    ],
    damageEffects: [
      {
        id: "reliquary-of-truth-crit-dmg",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.reliquaryOfTruthState === "inactive"
            ? []
            : [
                {
                  stat: "critDmg",
                  value: critDmg[refinementIndex] * 1.5,
                },
              ],
      },
    ],
    refinementDescriptions: critRate.map(
      (value, index) =>
        `暴击率提高 ${value}%；战技后元素精通提高 ${elementalMastery[index]}，月绽放后暴伤提高 ${critDmg[index]}%，双状态强化 50%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "reliquaryOfTruthState",
      label: "秘匣状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "仅常驻暴击率" },
        { value: "active", label: "谎言与真理均生效" },
      ],
    },
  },
};
