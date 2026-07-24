import type { WeaponPreset } from "./types.ts";

const attackBonus = [20, 25, 30, 35, 40] as const;

export const tamayurateiNoOhanashi: WeaponPreset = {
  id: "tamayuratei-no-ohanashi",
  name: "且住亭御咄",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 565,
  secondaryStat: "energyRecharge",
  secondaryValue: 30.6,
  secondaryLabel: "元素充能效率 +30.6%",
  passive: {
    name: "长野原流·御咄",
    description:
      "施放元素战技时，攻击力与移动速度提高 10 秒。",
    panelEffects: [
      {
        id: "tamayuratei-no-ohanashi-attack",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.tamayurateiState === "inactive"
            ? []
            : [
                {
                  stat: "atkPct",
                  value: attackBonus[refinementIndex],
                },
              ],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value) =>
        `施放元素战技时，攻击力提高 ${value}%、移动速度提高 10%，持续 10 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "tamayurateiState",
      label: "且住亭御咄状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未施放元素战技" },
        { value: "active", label: "元素战技后 10 秒内" },
      ],
    },
  },
};
