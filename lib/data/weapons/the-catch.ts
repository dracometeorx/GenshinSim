import type { WeaponPreset } from "./types.ts";

const burstDamageBonus = [16, 20, 24, 28, 32] as const;
const burstCritRate = [6, 7.5, 9, 10.5, 12] as const;

export const theCatch: WeaponPreset = {
  id: "the-catch",
  name: "「渔获」",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "energyRecharge",
  secondaryValue: 45.9,
  secondaryLabel: "元素充能效率 +45.9%",
  passive: {
    name: "船歌",
    description:
      "元素爆发造成的伤害提升 16%，元素爆发的暴击率提升 6%。",
    damageEffects: [
      {
        id: "the-catch-burst-bonuses",
        evaluate: ({ target, refinementIndex }) =>
          target.category === "burst"
            ? [
                {
                  stat: "damageBonus",
                  value: burstDamageBonus[refinementIndex],
                },
                {
                  stat: "critRate",
                  value: burstCritRate[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: [
      "元素爆发伤害提升 16%，元素爆发暴击率提升 6%。",
      "元素爆发伤害提升 20%，元素爆发暴击率提升 7.5%。",
      "元素爆发伤害提升 24%，元素爆发暴击率提升 9%。",
      "元素爆发伤害提升 28%，元素爆发暴击率提升 10.5%。",
      "元素爆发伤害提升 32%，元素爆发暴击率提升 12%。",
    ],
  },
};
