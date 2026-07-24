import type { WeaponPreset } from "./types.ts";

const chargedBonus = [16, 20, 24, 28, 32] as const;
const attackPerGimmick = [16, 20, 24, 28, 32] as const;

export const theFirstGreatMagic: WeaponPreset = {
  id: "the-first-great-magic",
  name: "最初的大魔术",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "critDmg",
  secondaryValue: 66.2,
  secondaryLabel: "暴击伤害 +66.2%",
  passive: {
    name: "伟大者帕西法尔",
    description:
      "重击伤害提高；每名与装备者元素相同的其他队友提供一层「手法」攻击力加成，至多三层。",
    damageEffects: [
      {
        id: "the-first-great-magic-charged",
        evaluate: ({ refinementIndex, target }) =>
          target.category === "charged"
            ? [
                {
                  stat: "damageBonus",
                  value: chargedBonus[refinementIndex],
                },
              ]
            : [],
      },
    ],
    teamBuffs: [
      {
        id: "the-first-great-magic-gimmick",
        name: "手法",
        description:
          "按队伍中与装备者元素相同的其他角色数量提高装备者攻击力。",
        appliesToSelf: true,
        appliesToTeammates: false,
        evaluate: ({ source, party }) => {
          const stacks = Math.min(
            3,
            Math.max(
              0,
              party.elements.filter(
                (element) => element === source.element,
              ).length - 1,
            ),
          );
          return stacks
            ? [
                {
                  kind: "panel",
                  stat: "atkPct",
                  value:
                    attackPerGimmick[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ] * stacks,
                },
              ]
            : [];
        },
      },
    ],
    refinementDescriptions: chargedBonus.map(
      (value, index) =>
        `重击伤害提高 ${value}%；每层「手法」攻击力提高 ${attackPerGimmick[index]}%，至多三层。`,
    ) as [string, string, string, string, string],
  },
};
