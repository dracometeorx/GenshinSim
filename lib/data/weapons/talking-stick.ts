import type { WeaponPreset } from "./types.ts";

const attackBonus = [16, 20, 24, 28, 32] as const;
const elementalBonus = [12, 15, 18, 21, 24] as const;

export const talkingStick: WeaponPreset = {
  id: "talking-stick",
  name: "聊聊棒",
  weaponType: "claymore",
  level: 90,
  refinement: 1,
  baseAtk: 565,
  secondaryStat: "critRate",
  secondaryValue: 18.4,
  secondaryLabel: "暴击率 +18.4%",
  passive: {
    name: "伶牙俐齿",
    description:
      "承受火元素附着后提高攻击力；承受水、冰、雷或草元素附着后提高全元素伤害。",
    panelEffects: [
      {
        id: "talking-stick-pyro",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.talkingStickState === "pyro" ||
          weaponSelections.talkingStickState === "both"
            ? [
                {
                  stat: "atkPct",
                  value: attackBonus[refinementIndex],
                },
              ]
            : [],
      },
    ],
    damageEffects: [
      {
        id: "talking-stick-elemental",
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.talkingStickState === "elemental" ||
          weaponSelections.talkingStickState === "both"
            ? [
                {
                  stat: "damageBonus",
                  value: elementalBonus[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value, index) =>
        `火附着后攻击力提高 ${value}%；水/冰/雷/草附着后全元素伤害提高 ${elementalBonus[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "talkingStickState",
      label: "元素附着效果",
      defaultValue: "both",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "pyro", label: "火附着 · 攻击力" },
        {
          value: "elemental",
          label: "水 / 冰 / 雷 / 草附着 · 元素伤害",
        },
        { value: "both", label: "两类效果同时生效" },
      ],
    },
  },
};
