import type { WeaponPreset } from "./types.ts";

const attackBonus = [24, 30, 36, 42, 48] as const;

export const thrillingTales: WeaponPreset = {
  id: "thrilling-tales",
  name: "讨龙英杰谭",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 401,
  secondaryStat: "hpPct",
  secondaryValue: 35.2,
  secondaryLabel: "生命值 +35.2%",
  passive: {
    name: "传承",
    description:
      "主动切换角色时，新登场角色的攻击力提高 10 秒。",
    teamBuffs: [
      {
        id: "thrilling-tales-attack",
        name: "传承",
        description:
          "由讨龙英杰谭装备者切换至当前角色后，提高当前角色攻击力。",
        stackingGroup: "thrilling-tales-attack",
        evaluate: ({ source }) =>
          source.weaponSelections.thrillingTalesState === "inactive"
            ? []
            : [
                {
                  kind: "panel",
                  stat: "atkPct",
                  value:
                    attackBonus[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                },
              ],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value) =>
        `切换角色后，新登场角色攻击力提高 ${value}%，持续 10 秒。`,
    ) as [string, string, string, string, string],
    control: {
      key: "thrillingTalesState",
      label: "传承状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未切换至目标角色" },
        { value: "active", label: "切换后 10 秒内" },
      ],
    },
  },
};
