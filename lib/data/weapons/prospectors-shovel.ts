import type { WeaponPreset } from "./types.ts";

const electroChargedBonus = [48, 60, 72, 84, 96] as const;
const lunarChargedBonus = [12, 15, 18, 21, 24] as const;

export const prospectorsShovel: WeaponPreset = {
  id: "prospectors-shovel",
  name: "掘金之锹",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "atkPct",
  secondaryValue: 41.3,
  secondaryLabel: "攻击力 +41.3%",
  passive: {
    name: "干脆利落",
    description:
      "提高感电与月感电伤害；月兆·满辉时月感电增益翻倍。",
    damageEffects: [
      {
        id: "prospectors-shovel-lunar-charged",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "lunarReactionDamageBonus",
            value: lunarChargedBonus[refinementIndex],
            lunarReactions: ["lunarCharged"],
          },
        ],
      },
    ],
    teamBuffs: [
      {
        id: "prospectors-shovel-ascendant",
        name: "月兆·满辉",
        description:
          "月兆·满辉时，装备者的月感电伤害获得额外提升。",
        appliesToSelf: true,
        appliesToTeammates: false,
        evaluate: ({ source, party }) =>
          party.moonsignLevel === "ascendant"
            ? [
                {
                  kind: "damage",
                  stat: "lunarReactionDamageBonus",
                  value:
                    lunarChargedBonus[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                  lunarReactions: ["lunarCharged"],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: lunarChargedBonus.map(
      (value, index) =>
        `感电伤害提高 ${electroChargedBonus[index]}%，月感电伤害提高 ${value}%；满辉时月感电额外提高 ${value}%。`,
    ) as [string, string, string, string, string],
  },
};
