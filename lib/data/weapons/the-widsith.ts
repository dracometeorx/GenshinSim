import type { WeaponPreset } from "./types.ts";

const attackBonus = [60, 75, 90, 105, 120] as const;
const elementalBonus = [48, 60, 72, 84, 96] as const;
const elementalMastery = [240, 300, 360, 420, 480] as const;

export const theWidsith: WeaponPreset = {
  id: "the-widsith",
  name: "流浪乐章",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critDmg",
  secondaryValue: 55.1,
  secondaryLabel: "暴击伤害 +55.1%",
  passive: {
    name: "登场乐",
    description:
      "角色登场时随机获得宣叙调、咏叹曲或间奏曲之一，持续 10 秒。",
    panelEffects: [
      {
        id: "the-widsith-song",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) => {
          const state = weaponSelections.widsithState;
          if (state === "recitative") {
            return [
              { stat: "atkPct", value: attackBonus[refinementIndex] },
            ];
          }
          if (state === "aria") {
            return [
              {
                stat: "elementalDmg",
                value: elementalBonus[refinementIndex],
              },
            ];
          }
          if (state === "interlude") {
            return [
              {
                stat: "elementalMastery",
                value: elementalMastery[refinementIndex],
              },
            ];
          }
          return [];
        },
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value, index) =>
        `宣叙调：攻击力 +${value}%；咏叹曲：元素伤害 +${elementalBonus[index]}%；间奏曲：元素精通 +${elementalMastery[index]}。`,
    ) as [string, string, string, string, string],
    control: {
      key: "widsithState",
      label: "登场乐效果",
      defaultValue: "recitative",
      options: [
        { value: "inactive", label: "未触发 / 冷却中" },
        { value: "recitative", label: "宣叙调 · 攻击力" },
        { value: "aria", label: "咏叹曲 · 元素伤害" },
        { value: "interlude", label: "间奏曲 · 元素精通" },
      ],
    },
  },
};
