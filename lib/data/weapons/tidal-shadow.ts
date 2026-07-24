import type { WeaponPreset } from "./types.ts";

const attackBonus = [24, 30, 36, 42, 48] as const;

export const tidalShadow: WeaponPreset = {
  id: "tidal-shadow",
  name: "浪影阔剑",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "atkPct",
  secondaryValue: 41.3,
  secondaryLabel: "攻击力 +41.3%",
  passive: {
    name: "巡航的白浪",
    description:
      "受到治疗后，攻击力提高 8 秒；后台也能触发。",
    panelEffects: [
      {
        id: "tidal-shadow-healed",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.tidalShadowState === "inactive"
            ? []
            : [
                {
                  stat: "atkPct",
                  value: attackBonus[refinementIndex],
                },
              ],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value) =>
        `受到治疗后攻击力提高 ${value}%，持续 8 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "tidalShadowState",
      label: "巡航的白浪",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未受到治疗" },
        { value: "active", label: "治疗后 8 秒内" },
      ],
    },
  },
};
