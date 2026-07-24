import type { WeaponPreset } from "./types.ts";

const damageBonus = [20, 25, 30, 35, 40] as const;
const critRate = [8, 10, 12, 14, 16] as const;

export const calamityOfEshu: WeaponPreset = {
  id: "calamity-of-eshu",
  name: "厄水之祸",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 565,
  secondaryStat: "atkPct",
  secondaryValue: 27.6,
  secondaryLabel: "攻击力 +27.6%",
  passive: {
    name: "弥漫之意",
    description:
      "处于护盾庇护下时，普通攻击与重击的伤害及暴击率提高。",
    damageEffects: [
      {
        id: "calamity-of-eshu-shield",
        evaluate: ({
          refinementIndex,
          target,
          weaponSelections,
        }) =>
          weaponSelections.calamityOfEshuState !== "inactive" &&
          (target.category === "normal" ||
            target.category === "charged")
            ? [
                {
                  stat: "damageBonus",
                  value: damageBonus[refinementIndex],
                },
                {
                  stat: "critRate",
                  value: critRate[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: damageBonus.map(
      (value, index) =>
        `护盾庇护下，普攻/重击伤害提高 ${value}%，暴击率提高 ${critRate[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "calamityOfEshuState",
      label: "护盾状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "无护盾" },
        { value: "active", label: "处于护盾庇护" },
      ],
    },
  },
};
