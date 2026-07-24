import type { WeaponPreset } from "./types.ts";

const skillBonusPerStack = [8, 10, 12, 14, 16] as const;
const hpBonusPerStack = [14, 17.5, 21, 24.5, 28] as const;

function skillStacks(state: string | undefined) {
  if (state === "skill1") return 1;
  if (state === "skill2") return 2;
  if (state === "skill3" || state === "full") return 3;
  return 0;
}

export const splendorOfTranquilWaters: WeaponPreset = {
  id: "splendor-of-tranquil-waters",
  name: "静水流涌之辉",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "critDmg",
  secondaryValue: 88.2,
  secondaryLabel: "暴击伤害 +88.2%",
  passive: {
    name: "湖光的朝与暮",
    description:
      "装备者生命值变化时提高战技伤害，至多三层；队友生命值变化时提高装备者生命值上限，至多两层。",
    panelEffects: [
      {
        id: "splendor-of-tranquil-waters-hp",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.splendorState === "full"
            ? [
                {
                  stat: "hpPct",
                  value: hpBonusPerStack[refinementIndex] * 2,
                },
              ]
            : [],
      },
    ],
    damageEffects: [
      {
        id: "splendor-of-tranquil-waters-skill",
        evaluate: ({
          refinementIndex,
          target,
          weaponSelections,
        }) => {
          const stacks = skillStacks(weaponSelections.splendorState);
          return target.category === "skill" && stacks
            ? [
                {
                  stat: "damageBonus",
                  value:
                    skillBonusPerStack[refinementIndex] * stacks,
                },
              ]
            : [];
        },
      },
    ],
    refinementDescriptions: skillBonusPerStack.map(
      (value, index) =>
        `自身生命变化每层战技伤害 +${value}%（三层 ${value * 3}%）；队友生命变化每层生命上限 +${hpBonusPerStack[index]}%（两层 ${hpBonusPerStack[index] * 2}%）。`,
    ) as [string, string, string, string, string],
    control: {
      key: "splendorState",
      label: "湖光状态",
      defaultValue: "full",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "skill1", label: "自身生命变化 1 层" },
        { value: "skill2", label: "自身生命变化 2 层" },
        { value: "skill3", label: "自身生命变化 3 层" },
        { value: "full", label: "战技三层 + 生命两层" },
      ],
    },
  },
};
