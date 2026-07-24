import type { WeaponPreset } from "./types.ts";

const damageBonus = [8, 10, 12, 14, 16] as const;
const vacuumBlade = [80, 100, 120, 140, 160] as const;

export const skywardPride: WeaponPreset = {
  id: "skyward-pride",
  name: "天空之傲",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 674,
  secondaryStat: "energyRecharge",
  secondaryValue: 36.8,
  secondaryLabel: "元素充能效率 +36.8%",
  passive: {
    name: "斩裂晴空的龙脊",
    description:
      "造成的伤害提高；爆发后普攻/重击产生真空刃，独立物理伤害不并入代表技能。",
    damageEffects: [
      {
        id: "skyward-pride-damage",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "damageBonus",
            value: damageBonus[refinementIndex],
          },
        ],
      },
    ],
    refinementDescriptions: damageBonus.map(
      (value, index) =>
        `造成的伤害提高 ${value}%；爆发后真空刃造成 ${vacuumBlade[index]}% 攻击力物理伤害。`,
    ) as [string, string, string, string, string],
  },
};
