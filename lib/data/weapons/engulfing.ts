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
    effect: {
      kind: "energyRechargeToAttack",
      controlKey: "engulfingBurst",
      activeValue: "active",
      activeEnergyRecharge: [30, 35, 40, 45, 50],
      attackRatio: [0.28, 0.35, 0.42, 0.49, 0.56],
      attackCap: [80, 90, 100, 110, 120],
    },
    refinementDescriptions: [
      "基于超出 100% 的元素充能效率提高攻击力（28%，至多 80%）；施放爆发后充能提高 30%。",
      "基于超出 100% 的元素充能效率提高攻击力（35%，至多 90%）；施放爆发后充能提高 35%。",
      "基于超出 100% 的元素充能效率提高攻击力（42%，至多 100%）；施放爆发后充能提高 40%。",
      "基于超出 100% 的元素充能效率提高攻击力（49%，至多 110%）；施放爆发后充能提高 45%。",
      "基于超出 100% 的元素充能效率提高攻击力（56%，至多 120%）；施放爆发后充能提高 50%。",
    ],
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
