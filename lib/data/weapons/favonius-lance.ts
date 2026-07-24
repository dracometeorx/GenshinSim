import type { WeaponPreset } from "./types.ts";

export const favoniusLance: WeaponPreset = {
  id: "favonius-lance",
  name: "西风长枪",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 565,
  secondaryStat: "energyRecharge",
  secondaryValue: 30.6,
  secondaryLabel: "元素充能效率 +30.6%",
  passive: {
    name: "顺风而行",
    description:
      "攻击造成暴击时，有 60% 概率产生少量元素微粒，为角色恢复 6 点元素能量；本版不模拟产球与循环。",
    refinementDescriptions: [
      "暴击时有 60% 概率产生元素微粒，每 12 秒至多触发一次；本版不模拟产球与循环。",
      "暴击时有 70% 概率产生元素微粒，每 10.5 秒至多触发一次；本版不模拟产球与循环。",
      "暴击时有 80% 概率产生元素微粒，每 9 秒至多触发一次；本版不模拟产球与循环。",
      "暴击时有 90% 概率产生元素微粒，每 7.5 秒至多触发一次；本版不模拟产球与循环。",
      "暴击时有 100% 概率产生元素微粒，每 6 秒至多触发一次；本版不模拟产球与循环。",
    ],
    utilityOnly: true,
  },
};
