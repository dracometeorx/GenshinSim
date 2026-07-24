import type { WeaponPreset } from "./types.ts";

const elementalMastery = [100, 125, 150, 175, 200] as const;

export const etherlightSpindlelute: WeaponPreset = {
  id: "etherlight-spindlelute",
  name: "天光的纺琴",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "energyRecharge",
  secondaryValue: 45.9,
  secondaryLabel: "元素充能效率 +45.9%",
  passive: {
    name: "最后的歌者",
    description:
      "施放元素战技后的 20 秒内，装备者的元素精通提高。",
    panelEffects: [
      {
        id: "etherlight-spindlelute-mastery",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.etherlightSpindleluteState === "inactive"
            ? []
            : [
                {
                  stat: "elementalMastery",
                  value: elementalMastery[refinementIndex],
                },
              ],
      },
    ],
    refinementDescriptions: elementalMastery.map(
      (value) =>
        `施放元素战技后，元素精通提高 ${value} 点，持续 20 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "etherlightSpindleluteState",
      label: "最后的歌者",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未施放元素战技" },
        { value: "active", label: "战技后 20 秒内" },
      ],
    },
  },
};
