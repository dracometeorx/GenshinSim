import type { WeaponPreset } from "./types.ts";

const baseHpBonus = [10, 12, 14, 16, 18] as const;
const activeHpBonus = [14, 16, 18, 20, 22] as const;
const lunarCritDmg = [60, 80, 100, 120, 140] as const;

export const nocturnesCurtainCall: WeaponPreset = {
  id: "nocturnes-curtain-call",
  name: "帷间夜曲",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "critDmg",
  secondaryValue: 88.2,
  secondaryLabel: "暴击伤害 +88.2%",
  passive: {
    name: "十字路的旅歌",
    description:
      "提高生命值；触发或造成月曜反应伤害后进一步提高生命值及月曜反应暴击伤害。",
    panelEffects: [
      {
        id: "nocturnes-curtain-call-hp",
        stage: "additive",
        evaluate: ({ refinementIndex, weaponSelections }) => [
          {
            stat: "hpPct",
            value:
              baseHpBonus[refinementIndex] +
              (weaponSelections.nocturnesCurtainCallState === "inactive"
                ? 0
                : activeHpBonus[refinementIndex]),
          },
        ],
      },
    ],
    damageEffects: [
      {
        id: "nocturnes-curtain-call-lunar-crit",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.nocturnesCurtainCallState === "inactive"
            ? []
            : [
                {
                  stat: "critDmg",
                  value: lunarCritDmg[refinementIndex],
                  lunarReactions: [
                    "lunarCharged",
                    "lunarBloom",
                    "lunarCrystallize",
                  ],
                },
              ],
      },
    ],
    refinementDescriptions: baseHpBonus.map(
      (value, index) =>
        `生命值提高 ${value}%；触发后额外提高 ${activeHpBonus[index]}% 生命值，月曜反应暴伤提高 ${lunarCritDmg[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "nocturnesCurtainCallState",
      label: "丰饶海的神酒",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "active", label: "已触发" },
      ],
    },
  },
};
