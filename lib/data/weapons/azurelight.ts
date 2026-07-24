import type { WeaponPreset } from "./types.ts";

const attackBonus = [24, 30, 36, 42, 48] as const;
const critDmg = [40, 50, 60, 70, 80] as const;

export const azurelight: WeaponPreset = {
  id: "azurelight",
  name: "苍耀",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 674,
  secondaryStat: "critRate",
  secondaryValue: 22.1,
  secondaryLabel: "暴击率 +22.1%",
  passive: {
    name: "白山的馈赠",
    description:
      "施放元素战技后攻击力提高；能量为 0 时攻击力进一步提高，并提高暴击伤害。",
    panelEffects: [
      {
        id: "azurelight-attack",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const state = weaponSelections.azurelightState;
          if (state === "inactive") return [];
          return [
            {
              stat: "atkPct",
              value:
                attackBonus[refinementIndex] *
                (state === "zeroEnergy" ? 2 : 1),
            },
          ];
        },
      },
    ],
    damageEffects: [
      {
        id: "azurelight-zero-energy-crit",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.azurelightState === "zeroEnergy"
            ? [
                {
                  stat: "critDmg",
                  value: critDmg[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value, index) =>
        `战技后攻击力提高 ${value}%；能量为 0 时再提高 ${value}% 攻击力与 ${critDmg[index]}% 暴击伤害。`,
    ) as [string, string, string, string, string],
    control: {
      key: "azurelightState",
      label: "白山的馈赠",
      defaultValue: "zeroEnergy",
      options: [
        { value: "inactive", label: "未施放元素战技" },
        { value: "skill", label: "战技后 · 有能量" },
        { value: "zeroEnergy", label: "战技后 · 能量为 0" },
      ],
    },
  },
};
