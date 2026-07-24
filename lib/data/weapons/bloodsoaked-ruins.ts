import type { WeaponPreset } from "./types.ts";

const lunarBonus = [36, 48, 60, 72, 84] as const;
const critDmg = [28, 35, 42, 49, 56] as const;

export const bloodsoakedRuins: WeaponPreset = {
  id: "bloodsoaked-ruins",
  name: "血染荒城",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 674,
  secondaryStat: "critRate",
  secondaryValue: 22.1,
  secondaryLabel: "暴击率 +22.1%",
  passive: {
    name: "哀恸的赞礼",
    description:
      "施放元素爆发后月感电反应伤害提高；触发月感电后暴击伤害提高。",
    damageEffects: [
      {
        id: "bloodsoaked-ruins-lunar-bonuses",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.bloodsoakedRuinsState === "inactive"
            ? []
            : [
                {
                  stat: "lunarReactionDamageBonus",
                  value: lunarBonus[refinementIndex],
                  lunarReactions: ["lunarCharged"],
                },
                {
                  stat: "critDmg",
                  value: critDmg[refinementIndex],
                  lunarReactions: ["lunarCharged"],
                },
              ],
      },
    ],
    refinementDescriptions: lunarBonus.map(
      (value, index) =>
        `爆发后月感电反应伤害提高 ${value}%；触发月感电后暴击伤害提高 ${critDmg[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "bloodsoakedRuinsState",
      label: "哀恸的赞礼",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "active", label: "爆发与荒落的挽歌均生效" },
      ],
    },
  },
};
