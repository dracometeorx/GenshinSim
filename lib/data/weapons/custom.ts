import type { WeaponPreset } from "./types.ts";

export const customWeapon: WeaponPreset = {
  id: "custom",
  name: "自定义武器",
  level: 90,
  refinement: 1,
  baseAtk: 600,
  secondaryStat: "none",
  secondaryValue: 0,
  secondaryLabel: "无副属性",
  passive: {
    name: "无武器特效",
    description: "自定义武器暂不附加额外被动。",
  },
};
