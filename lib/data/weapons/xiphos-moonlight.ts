import type { WeaponPreset } from "./types.ts";

const rechargePerMastery = [
  0.036, 0.045, 0.054, 0.063, 0.072,
] as const;

export const xiphosMoonlight: WeaponPreset = {
  id: "xiphos-moonlight",
  name: "西福斯的月光",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "elementalMastery",
  secondaryValue: 165,
  secondaryLabel: "元素精通 +165",
  passive: {
    name: "镇灵的低语",
    description:
      "每 10 秒基于元素精通提高装备者充能效率，附近队友获得该加成的 30%。",
    panelEffects: [
      {
        id: "xiphos-moonlight-recharge",
        stage: "conversion",
        evaluate: ({ refinementIndex, panel }) => [
          {
            stat: "energyRecharge",
            value:
              panel.elementalMastery *
              rechargePerMastery[refinementIndex],
          },
        ],
      },
    ],
    teamBuffs: [
      {
        id: "xiphos-moonlight-party",
        name: "镇灵的低语",
        description:
          "队友获得装备者元素精通转化充能效率的 30%。",
        evaluate: ({ source }) => [
          {
            kind: "panel",
            stat: "energyRecharge",
            value:
              source.panel.elementalMastery *
              rechargePerMastery[
                Math.min(
                  4,
                  Math.max(0, source.weaponRefinement - 1),
                )
              ] *
              0.3,
          },
        ],
      },
    ],
    refinementDescriptions: rechargePerMastery.map(
      (value) =>
        `每点元素精通使装备者充能效率提高 ${value}%，队友获得该数值的 30%。`,
    ) as [string, string, string, string, string],
  },
};
