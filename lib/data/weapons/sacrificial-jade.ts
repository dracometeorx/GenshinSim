import type { WeaponPreset } from "./types.ts";

const hpBonus = [32, 40, 48, 56, 64] as const;
const elementalMastery = [40, 50, 60, 70, 80] as const;

export const sacrificialJade: WeaponPreset = {
  id: "sacrificial-jade",
  name: "遗祀玉珑",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 454,
  secondaryStat: "critRate",
  secondaryValue: 36.8,
  secondaryLabel: "暴击率 +36.8%",
  passive: {
    name: "碧玉流转",
    description:
      "处于队伍后台超过 5 秒时，生命值上限与元素精通提高；在场 10 秒后失效。",
    panelEffects: [
      {
        id: "sacrificial-jade-stats",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.sacrificialJadeState === "inactive"
            ? []
            : [
                { stat: "hpPct", value: hpBonus[refinementIndex] },
                {
                  stat: "elementalMastery",
                  value: elementalMastery[refinementIndex],
                },
              ],
      },
    ],
    refinementDescriptions: hpBonus.map(
      (value, index) =>
        `后台超过 5 秒时，生命值上限提高 ${value}%、元素精通提高 ${elementalMastery[index]} 点。`,
    ) as [string, string, string, string, string],
    control: {
      key: "sacrificialJadeState",
      label: "碧玉流转",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "前台超过 10 秒" },
        { value: "active", label: "后台效果生效" },
      ],
    },
  },
};
