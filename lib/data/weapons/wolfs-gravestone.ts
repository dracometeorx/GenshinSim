import type { WeaponPreset } from "./types.ts";

const selfAttack = [20, 25, 30, 35, 40] as const;
const partyAttack = [40, 50, 60, 70, 80] as const;

export const wolfsGravestone: WeaponPreset = {
  id: "wolfs-gravestone",
  name: "狼的末路",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "atkPct",
  secondaryValue: 49.6,
  secondaryLabel: "攻击力 +49.6%",
  passive: {
    name: "如狼般狩猎者",
    description:
      "攻击力常驻提高；命中生命值低于 30% 的敌人时，全队攻击力进一步提高。",
    panelEffects: [
      {
        id: "wolfs-gravestone-self",
        stage: "additive",
        evaluate: ({ refinementIndex }) => [
          {
            stat: "atkPct",
            value: selfAttack[refinementIndex],
          },
        ],
      },
    ],
    teamBuffs: [
      {
        id: "wolfs-gravestone-party",
        name: "如狼般狩猎者",
        description:
          "命中低生命敌人后，提高全队攻击力，持续 12 秒。",
        stackingGroup: "wolfs-gravestone-party",
        appliesToSelf: true,
        evaluate: ({ source }) =>
          source.weaponSelections.wolfsGravestoneState === "inactive"
            ? []
            : [
                {
                  kind: "panel",
                  stat: "atkPct",
                  value:
                    partyAttack[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                },
              ],
      },
    ],
    refinementDescriptions: selfAttack.map(
      (value, index) =>
        `攻击力提高 ${value}%；命中生命低于 30% 的敌人后，全队攻击力提高 ${partyAttack[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "wolfsGravestoneState",
      label: "低生命敌人触发",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未命中低生命敌人" },
        { value: "active", label: "全队增益生效" },
      ],
    },
  },
};
