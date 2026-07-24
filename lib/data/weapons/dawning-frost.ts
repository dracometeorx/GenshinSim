import type { WeaponPreset } from "./types.ts";

const chargedMastery = [72, 90, 108, 126, 144] as const;
const skillMastery = [48, 60, 72, 84, 96] as const;

export const dawningFrost: WeaponPreset = {
  id: "dawning-frost",
  name: "霜辰",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critDmg",
  secondaryValue: 55.1,
  secondaryLabel: "暴击伤害 +55.1%",
  passive: {
    name: "深宵的胎梦",
    description:
      "重击与元素战技命中后分别提高元素精通，两种效果可同时存在。",
    panelEffects: [
      {
        id: "dawning-frost-mastery",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const state =
            weaponSelections.dawningFrostState ?? "both";
          return [
            ...(state === "charged" || state === "both"
              ? [
                  {
                    stat: "elementalMastery" as const,
                    value: chargedMastery[refinementIndex],
                  },
                ]
              : []),
            ...(state === "skill" || state === "both"
              ? [
                  {
                    stat: "elementalMastery" as const,
                    value: skillMastery[refinementIndex],
                  },
                ]
              : []),
          ];
        },
      },
    ],
    refinementDescriptions: chargedMastery.map(
      (value, index) =>
        `重击命中后元素精通提高 ${value} 点；战技命中后提高 ${skillMastery[index]} 点，均持续 10 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "dawningFrostState",
      label: "深宵的胎梦",
      defaultValue: "both",
      options: [
        { value: "inactive", label: "均未触发" },
        { value: "charged", label: "仅重击效果" },
        { value: "skill", label: "仅战技效果" },
        { value: "both", label: "两种效果同时生效" },
      ],
    },
  },
};
