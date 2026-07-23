import type { WeaponPreset } from "./types.ts";

export const dreams: WeaponPreset = {
  id: "dreams",
  name: "千夜浮梦",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "elementalMastery",
  secondaryValue: 265,
  secondaryLabel: "元素精通 +265",
  passive: {
    name: "千夜的曙歌",
    description: "效果取决于队伍中其他角色的元素类型，本版暂不计入。",
    teammateDependent: true,
  },
};
