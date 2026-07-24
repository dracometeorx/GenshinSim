import type { WeaponPreset } from "./types.ts";

const energyRecharge = [24, 30, 36, 42, 48] as const;

export const oathswornEye: WeaponPreset = {
  id: "oathsworn-eye",
  name: "证誓之明瞳",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 565,
  secondaryStat: "atkPct",
  secondaryValue: 27.6,
  secondaryLabel: "攻击力 +27.6%",
  passive: {
    name: "微光的海渊民",
    description:
      "施放元素战技后的 10 秒内，元素充能效率提高。",
    panelEffects: [
      {
        id: "oathsworn-eye-recharge",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.oathswornEyeState === "inactive"
            ? []
            : [
                {
                  stat: "energyRecharge",
                  value: energyRecharge[refinementIndex],
                },
              ],
      },
    ],
    refinementDescriptions: energyRecharge.map(
      (value) =>
        `施放元素战技后，元素充能效率提高 ${value}%，持续 10 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "oathswornEyeState",
      label: "微光的海渊民",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未施放元素战技" },
        { value: "active", label: "战技后 10 秒内" },
      ],
    },
  },
};
