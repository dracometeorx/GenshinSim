import type { WeaponPreset } from "./types.ts";

const defenseBonus = [20, 25, 30, 35, 40] as const;
const lunarBonus = [64, 80, 96, 112, 128] as const;

export const lightbearingMoonshard: WeaponPreset = {
  id: "lightbearing-moonshard",
  name: "朏魄含光",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "critDmg",
  secondaryValue: 88.2,
  secondaryLabel: "暴击伤害 +88.2%",
  passive: {
    name: "琅玕衍义",
    description:
      "防御力提高；施放元素战技后的 5 秒内月结晶反应伤害提高。",
    panelEffects: [
      {
        id: "lightbearing-moonshard-defense",
        stage: "additive",
        evaluate: ({ refinementIndex }) => [
          { stat: "defPct", value: defenseBonus[refinementIndex] },
        ],
      },
    ],
    damageEffects: [
      {
        id: "lightbearing-moonshard-lunar-crystallize",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.lightbearingMoonshardState === "inactive"
            ? []
            : [
                {
                  stat: "lunarReactionDamageBonus",
                  value: lunarBonus[refinementIndex],
                  lunarReactions: ["lunarCrystallize"],
                },
              ],
      },
    ],
    refinementDescriptions: defenseBonus.map(
      (value, index) =>
        `防御力提高 ${value}%；战技后的月结晶反应伤害提高 ${lunarBonus[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "lightbearingMoonshardState",
      label: "琅玕衍义",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "战技增益未生效" },
        { value: "active", label: "战技后 5 秒内" },
      ],
    },
  },
};
