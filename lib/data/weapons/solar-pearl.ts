import type { WeaponPreset } from "./types.ts";

const damageBonus = [20, 25, 30, 35, 40] as const;

export const solarPearl: WeaponPreset = {
  id: "solar-pearl",
  name: "匣里日月",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critRate",
  secondaryValue: 27.6,
  secondaryLabel: "暴击率 +27.6%",
  passive: {
    name: "日月辉",
    description:
      "普攻命中提高战技与爆发伤害；战技或爆发命中提高普攻伤害。",
    damageEffects: [
      {
        id: "solar-pearl-bonuses",
        evaluate: ({ refinementIndex, target, weaponSelections }) => {
          const state = weaponSelections.solarPearlState ?? "both";
          const fromNormal =
            state === "normalHit" || state === "both";
          const fromSkillBurst =
            state === "skillBurstHit" || state === "both";
          if (
            (fromNormal &&
              (target.category === "skill" ||
                target.category === "burst")) ||
            (fromSkillBurst && target.category === "normal")
          ) {
            return [
              {
                stat: "damageBonus",
                value: damageBonus[refinementIndex],
              },
            ];
          }
          return [];
        },
      },
    ],
    refinementDescriptions: damageBonus.map(
      (value) =>
        `普攻命中使战技/爆发伤害提高 ${value}%；战技或爆发命中使普攻伤害提高 ${value}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "solarPearlState",
      label: "日月辉状态",
      defaultValue: "both",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "normalHit", label: "普攻已命中" },
        { value: "skillBurstHit", label: "战技 / 爆发已命中" },
        { value: "both", label: "两类效果同时生效" },
      ],
    },
  },
};
