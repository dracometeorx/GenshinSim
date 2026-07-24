import type { WeaponPreset } from "./types.ts";

const attackBonus = [12, 15, 18, 21, 24] as const;
const elementalMastery = [48, 60, 72, 84, 96] as const;

export const missiveWindspear: WeaponPreset = {
  id: "missive-windspear",
  name: "风信之锋",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "atkPct",
  secondaryValue: 41.3,
  secondaryLabel: "攻击力 +41.3%",
  passive: {
    name: "不至之风",
    description:
      "触发元素反应后的 10 秒内，攻击力与元素精通提高。",
    panelEffects: [
      {
        id: "missive-windspear-reaction",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.missiveWindspearState === "inactive"
            ? []
            : [
                {
                  stat: "atkPct",
                  value: attackBonus[refinementIndex],
                },
                {
                  stat: "elementalMastery",
                  value: elementalMastery[refinementIndex],
                },
              ],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value, index) =>
        `触发元素反应后，攻击力提高 ${value}%、元素精通提高 ${elementalMastery[index]} 点，持续 10 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "missiveWindspearState",
      label: "不至之风",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发元素反应" },
        { value: "active", label: "触发后 10 秒内" },
      ],
    },
  },
};
