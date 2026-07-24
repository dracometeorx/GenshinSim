import type { WeaponPreset } from "./types.ts";

const masteryToAttack = [0.24, 0.3, 0.36, 0.42, 0.48] as const;

export const makhairaAquamarine: WeaponPreset = {
  id: "makhaira-aquamarine",
  name: "玛海菈的水色",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "elementalMastery",
  secondaryValue: 165,
  secondaryLabel: "元素精通 +165",
  passive: {
    name: "沙上楼阁",
    description:
      "每 10 秒基于元素精通提高装备者攻击力，附近队友获得该加成的 30%。",
    panelEffects: [
      {
        id: "makhaira-aquamarine-attack",
        stage: "conversion",
        evaluate: ({ refinementIndex, panel }) => [
          {
            stat: "flatAtk",
            value:
              panel.elementalMastery *
              masteryToAttack[refinementIndex],
          },
        ],
      },
    ],
    teamBuffs: [
      {
        id: "makhaira-aquamarine-party",
        name: "沙上楼阁",
        description:
          "队友获得装备者元素精通转化攻击力的 30%。",
        evaluate: ({ source }) => [
          {
            kind: "panel",
            stat: "flatAtk",
            value:
              source.panel.elementalMastery *
              masteryToAttack[
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
    refinementDescriptions: masteryToAttack.map(
      (value) =>
        `装备者获得元素精通 ${value * 100}% 的攻击力，队友获得该数值的 30%。`,
    ) as [string, string, string, string, string],
  },
};
