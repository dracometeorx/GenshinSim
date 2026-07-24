import type { WeaponPreset } from "./types.ts";

const damageBonus = [20, 24, 28, 32, 36] as const;

export const dragonsBane: WeaponPreset = {
  id: "dragons-bane",
  name: "匣里灭辰",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 454,
  secondaryStat: "elementalMastery",
  secondaryValue: 221,
  secondaryLabel: "元素精通 +221",
  passive: {
    name: "踏火止水",
    description:
      "对处于水元素或火元素影响下的敌人，造成的伤害提高 20%。",
    damageEffects: [
      {
        id: "dragons-bane-affected-enemy",
        evaluate: ({
          refinementIndex,
          weaponSelections,
        }) =>
          weaponSelections.dragonsBaneEnemyState === "affected"
            ? [
                {
                  stat: "damageBonus",
                  value: damageBonus[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: [
      "对处于水元素或火元素影响下的敌人，造成的伤害提高 20%。",
      "对处于水元素或火元素影响下的敌人，造成的伤害提高 24%。",
      "对处于水元素或火元素影响下的敌人，造成的伤害提高 28%。",
      "对处于水元素或火元素影响下的敌人，造成的伤害提高 32%。",
      "对处于水元素或火元素影响下的敌人，造成的伤害提高 36%。",
    ],
    control: {
      key: "dragonsBaneEnemyState",
      label: "敌人元素状态",
      defaultValue: "affected",
      options: [
        { value: "affected", label: "水 / 火元素影响" },
        { value: "none", label: "无水 / 火附着" },
      ],
    },
  },
};
