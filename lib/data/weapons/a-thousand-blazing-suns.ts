import type { WeaponPreset } from "./types.ts";

const critDmgBonus = [20, 25, 30, 35, 40] as const;
const attackBonus = [28, 35, 42, 49, 56] as const;

function stateMultiplier(state: string | undefined) {
  if (state === "nightsoul") return 1.75;
  if (state === "scorching") return 1;
  return 0;
}

export const aThousandBlazingSuns: WeaponPreset = {
  id: "a-thousand-blazing-suns",
  name: "焚曜千阳",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 741,
  secondaryStat: "critRate",
  secondaryValue: 11,
  secondaryLabel: "暴击率 +11%",
  passive: {
    name: "落日重燃的黎明",
    description:
      "施放元素战技或元素爆发后获得焚光，提高攻击力与暴击伤害；夜魂加持时效果提高 75%。",
    panelEffects: [
      {
        id: "blazing-suns-attack",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const multiplier = stateMultiplier(
            weaponSelections.blazingSunsState,
          );
          return multiplier
            ? [
                {
                  stat: "atkPct",
                  value: attackBonus[refinementIndex] * multiplier,
                },
              ]
            : [];
        },
      },
    ],
    damageEffects: [
      {
        id: "blazing-suns-crit-damage",
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const multiplier = stateMultiplier(
            weaponSelections.blazingSunsState,
          );
          return multiplier
            ? [
                {
                  stat: "critDmg",
                  value: critDmgBonus[refinementIndex] * multiplier,
                },
              ]
            : [];
        },
      },
    ],
    refinementDescriptions: attackBonus.map(
      (attack, index) =>
        `焚光使攻击力提高 ${attack}%、暴击伤害提高 ${critDmgBonus[index]}%；夜魂加持时两项效果提高 75%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "blazingSunsState",
      label: "焚光状态",
      defaultValue: "nightsoul",
      options: [
        { value: "inactive", label: "未触发焚光" },
        { value: "scorching", label: "焚光已触发" },
        { value: "nightsoul", label: "焚光 + 夜魂加持 · 效果 ×1.75" },
      ],
    },
  },
};
