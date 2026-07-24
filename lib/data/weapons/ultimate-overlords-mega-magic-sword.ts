import type { WeaponPreset } from "./types.ts";

const attackBonus = [12, 15, 18, 21, 24] as const;

export const ultimateOverlordsMegaMagicSword: WeaponPreset = {
  id: "ultimate-overlords-mega-magic-sword",
  name: "「究极霸王超级魔剑」",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 565,
  secondaryStat: "energyRecharge",
  secondaryValue: 30.6,
  secondaryLabel: "元素充能效率 +30.6%",
  passive: {
    name: "加油！",
    description:
      "攻击力提高；帮助海沫村的美露莘后，可获得等量的额外攻击力加成。",
    panelEffects: [
      {
        id: "ultimate-overlord-attack",
        stage: "additive",
        evaluate: ({ refinementIndex, weaponSelections }) => [
          {
            stat: "atkPct",
            value:
              attackBonus[refinementIndex] *
              (weaponSelections.ultimateOverlordState === "full"
                ? 2
                : 1),
          },
        ],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value) =>
        `攻击力提高 ${value}%；完成全部美露莘帮助后额外提高 ${value}%，合计 ${value * 2}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "ultimateOverlordState",
      label: "美露莘声援",
      defaultValue: "full",
      options: [
        { value: "base", label: "仅基础效果" },
        { value: "full", label: "全部帮助完成" },
      ],
    },
  },
};
