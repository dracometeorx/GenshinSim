import type { WeaponPreset } from "./types.ts";

export const homa: WeaponPreset = {
  id: "homa",
  name: "护摩之杖",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "critDmg",
  secondaryValue: 66.2,
  secondaryLabel: "暴击伤害 +66.2%",
  passive: {
    name: "无羁的朱赤之蝶",
    description: "生命值提高 20%；攻击力提高生命值上限的 0.8%，生命低于 50% 时再提高 1%。",
    control: {
      key: "homaHpState",
      label: "当前生命值",
      defaultValue: "above50",
      options: [
        { value: "above50", label: "不低于 50%" },
        { value: "below50", label: "低于 50%" },
      ],
    },
  },
};
