import type { WeaponPreset } from "./types.ts";

const multipleEnemyBonus = [16, 20, 24, 28, 32] as const;
const singleEnemyAttackBonus = [24, 30, 36, 42, 48] as const;

export const deathmatch: WeaponPreset = {
  id: "deathmatch",
  name: "决斗之枪",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 454,
  secondaryStat: "critRate",
  secondaryValue: 36.8,
  secondaryLabel: "暴击率 +36.8%",
  passive: {
    name: "角斗士",
    description:
      "身边至少有 2 个敌人时，攻击力与防御力提升 16%；少于 2 个敌人时，攻击力提升 24%。",
    panelEffects: [
      {
        id: "deathmatch-nearby-opponents",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          if (weaponSelections.deathmatchEnemyCount === "multiple") {
            return [
              {
                stat: "atkPct",
                value: multipleEnemyBonus[refinementIndex],
              },
              {
                stat: "defPct",
                value: multipleEnemyBonus[refinementIndex],
              },
            ];
          }
          return [
            {
              stat: "atkPct",
              value: singleEnemyAttackBonus[refinementIndex],
            },
          ];
        },
      },
    ],
    refinementDescriptions: [
      "至少 2 个敌人时攻击与防御提升 16%；少于 2 个时攻击提升 24%。",
      "至少 2 个敌人时攻击与防御提升 20%；少于 2 个时攻击提升 30%。",
      "至少 2 个敌人时攻击与防御提升 24%；少于 2 个时攻击提升 36%。",
      "至少 2 个敌人时攻击与防御提升 28%；少于 2 个时攻击提升 42%。",
      "至少 2 个敌人时攻击与防御提升 32%；少于 2 个时攻击提升 48%。",
    ],
    control: {
      key: "deathmatchEnemyCount",
      label: "附近敌人数量",
      defaultValue: "single",
      options: [
        { value: "single", label: "少于 2 个" },
        { value: "multiple", label: "至少 2 个" },
      ],
    },
  },
};
