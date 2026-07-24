import type { WeaponPreset } from "./types.ts";

const masteryPerSymbol = [40, 50, 60, 70, 80] as const;
const energyPerSymbol = [2, 2.5, 3, 3.5, 4] as const;

export const theDockhandsAssistant: WeaponPreset = {
  id: "the-dockhands-assistant",
  name: "船坞长剑",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "hpPct",
  secondaryValue: 41.3,
  secondaryLabel: "生命值 +41.3%",
  passive: {
    name: "船工号子",
    description:
      "受到治疗或治疗他人时获得坚忍标记；施放战技或爆发消耗至多三枚，提高元素精通并恢复能量。",
    panelEffects: [
      {
        id: "the-dockhands-assistant-mastery",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const symbols = Math.min(
            3,
            Math.max(
              0,
              Number(weaponSelections.dockhandSymbols) || 0,
            ),
          );
          return [
            {
              stat: "elementalMastery",
              value: masteryPerSymbol[refinementIndex] * symbols,
            },
          ];
        },
      },
    ],
    refinementDescriptions: masteryPerSymbol.map(
      (value, index) =>
        `每枚坚忍标记提供 ${value} 点元素精通并恢复 ${energyPerSymbol[index]} 点能量，至多三枚。`,
    ) as [string, string, string, string, string],
    control: {
      key: "dockhandSymbols",
      label: "消耗坚忍标记",
      defaultValue: "3",
      options: [0, 1, 2, 3].map((value) => ({
        value: String(value),
        label: `${value} 枚`,
      })),
    },
  },
};
