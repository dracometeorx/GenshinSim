import type { WeaponPreset } from "./types.ts";

export const mistsplitter: WeaponPreset = {
  id: "mistsplitter",
  name: "雾切之回光",
  weaponType: "sword",
  level: 90,
  refinement: 1,
  baseAtk: 674,
  secondaryStat: "critDmg",
  secondaryValue: 44.1,
  secondaryLabel: "暴击伤害 +44.1%",
  passive: {
    name: "雾切御腰物",
    description: "获得 12% 元素伤害加成，并根据巴印层数额外获得 0% / 8% / 16% / 28%。",
    refinementDescriptions: [
      "获得 12% 元素伤害加成，并根据巴印层数额外获得 0% / 8% / 16% / 28%。",
      "获得 15% 元素伤害加成，并根据巴印层数额外获得 0% / 10% / 20% / 35%。",
      "获得 18% 元素伤害加成，并根据巴印层数额外获得 0% / 12% / 24% / 42%。",
      "获得 21% 元素伤害加成，并根据巴印层数额外获得 0% / 14% / 28% / 49%。",
      "获得 24% 元素伤害加成，并根据巴印层数额外获得 0% / 16% / 32% / 56%。",
    ],
    control: {
      key: "mistsplitterStacks",
      label: "雾切之巴印",
      defaultValue: "0",
      options: [
        { value: "0", label: "0 层" },
        { value: "1", label: "1 层" },
        { value: "2", label: "2 层" },
        { value: "3", label: "3 层" },
      ],
    },
  },
};
