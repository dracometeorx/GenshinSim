import type { WeaponPreset } from "./types.ts";

const critRate = [4, 5, 6, 7, 8] as const;
const additionalAttack = [20, 25, 30, 35, 40] as const;

export const skywardBlade: WeaponPreset = {
  id: "skyward-blade",
  name: "天空之刃",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "energyRecharge",
  secondaryValue: 55.1,
  secondaryLabel: "元素充能效率 +55.1%",
  passive: {
    name: "穿刺高天的利齿",
    description:
      "暴击率提高；爆发后提高移动与攻击速度，普攻/重击附加攻击力伤害。附加物理伤害不并入代表技能。",
    damageEffects: [
      {
        id: "skyward-blade-crit-rate",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "critRate",
            value: critRate[refinementIndex],
          },
        ],
      },
    ],
    refinementDescriptions: critRate.map(
      (value, index) =>
        `暴击率提高 ${value}%；爆发后普攻/重击额外造成 ${additionalAttack[index]}% 攻击力伤害。`,
    ) as [string, string, string, string, string],
  },
};
