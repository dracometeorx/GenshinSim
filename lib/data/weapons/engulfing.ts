import type { WeaponPreset } from "./types.ts";

export const engulfing: WeaponPreset = {
  id: "engulfing",
  name: "薙草之稻光",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "energyRecharge",
  secondaryValue: 55.1,
  secondaryLabel: "元素充能效率 +55.1%",
  passive: {
    name: "非时之梦·常世灶食",
    description: "基于超出 100% 的元素充能效率提高攻击力（28%，至多 80%）；施放爆发后充能提高 30%。",
    control: {
      key: "engulfingBurst",
      label: "爆发后的 12 秒",
      defaultValue: "inactive",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "active", label: "已触发" },
      ],
    },
  },
};
