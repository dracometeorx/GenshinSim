import type { WeaponPreset } from "./types.ts";

const elementalBonus = [12, 15, 18, 21, 24] as const;
const attackPerStack = [3.2, 4, 4.8, 5.6, 6.4] as const;

export const calamityQueller: WeaponPreset = {
  id: "calamity-queller",
  name: "息灾",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 741,
  secondaryStat: "atkPct",
  secondaryValue: 16.5,
  secondaryLabel: "攻击力 +16.5%",
  passive: {
    name: "灭却之戒法",
    description:
      "获得全元素伤害加成；施放元素战技后获得持续 20 秒、至多六层的攻击力加成，处于后台时该加成翻倍。",
    panelEffects: [
      {
        id: "calamity-queller-consummation",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const state =
            weaponSelections.calamityQuellerState ?? "onField";
          if (state === "inactive") return [];
          const multiplier = state === "offField" ? 2 : 1;
          return [
            {
              stat: "atkPct",
              value:
                attackPerStack[refinementIndex] * 6 * multiplier,
            },
          ];
        },
      },
    ],
    damageEffects: [
      {
        id: "calamity-queller-elemental-bonus",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "damageBonus",
            value: elementalBonus[refinementIndex],
          },
        ],
      },
    ],
    refinementDescriptions: elementalBonus.map(
      (value, index) => {
        const fullStacks = Number(
          (attackPerStack[index] * 6).toFixed(1),
        );
        return `全元素伤害提高 ${value}%；战技后每秒攻击力提高 ${attackPerStack[index]}%，六层时为 ${fullStacks}%，后台翻倍。`;
      },
    ) as [string, string, string, string, string],
    control: {
      key: "calamityQuellerState",
      label: "圆顿状态（六层）",
      defaultValue: "onField",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "onField", label: "前台六层" },
        { value: "offField", label: "后台六层（翻倍）" },
      ],
    },
  },
};
