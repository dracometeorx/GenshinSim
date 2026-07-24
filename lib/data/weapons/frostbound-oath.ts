import type { WeaponPreset } from "./types.ts";

const defenseBonus = [16, 20, 24, 28, 32] as const;
const selfBonus = [40, 50, 60, 70, 80] as const;
const teamBonus = [20, 25, 30, 35, 40] as const;

export const frostboundOath: WeaponPreset = {
  id: "frostbound-oath",
  name: "霜结的誓金枝",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "critDmg",
  secondaryValue: 88.2,
  secondaryLabel: "暴击伤害 +88.2%",
  passive: {
    name: "与君致意的黎明",
    description:
      "提高防御力；战技或月结晶命中后提高自身岩伤与月结晶伤害，存在月笼时还提高其他队友对应伤害。",
    panelEffects: [
      {
        id: "frostbound-oath-defense",
        stage: "additive",
        evaluate: ({ refinementIndex }) => [
          { stat: "defPct", value: defenseBonus[refinementIndex] },
        ],
      },
    ],
    damageEffects: [
      {
        id: "frostbound-oath-self",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.frostboundOathState === "inactive"
            ? []
            : [
                { stat: "damageBonus", value: selfBonus[refinementIndex] },
                {
                  stat: "lunarReactionDamageBonus",
                  value: selfBonus[refinementIndex],
                  lunarReactions: ["lunarCrystallize"],
                },
              ],
      },
    ],
    teamBuffs: [
      {
        id: "frostbound-oath-team",
        name: "霜妖精的恶戏",
        description:
          "附近存在月笼时，提高其他队友的岩元素与月结晶反应伤害。",
        evaluate: ({ source, target }) =>
          target.element === "geo" &&
          source.weaponSelections.frostboundOathState !== "inactive"
            ? [
                {
                  kind: "damage",
                  stat: "damageBonus",
                  value:
                    teamBonus[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                  element: "geo",
                },
                {
                  kind: "damage",
                  stat: "lunarReactionDamageBonus",
                  value:
                    teamBonus[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                  lunarReactions: ["lunarCrystallize"],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: defenseBonus.map(
      (value, index) =>
        `防御力提高 ${value}%；自身岩伤/月结晶提高 ${selfBonus[index]}%，其他队友提高 ${teamBonus[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "frostboundOathState",
      label: "霜妖精的报恩",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "active", label: "已触发" },
      ],
    },
  },
};
