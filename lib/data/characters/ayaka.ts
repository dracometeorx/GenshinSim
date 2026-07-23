import type { CharacterPreset } from "./types.ts";

export const ayaka: CharacterPreset = {
  id: "ayaka",
  name: "神里绫华",
  level: 90,
  baseHp: 12858,
  baseAtk: 342,
  baseDef: 784,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "cryo",
  weaponType: "sword",
  defaultWeaponId: "mistsplitter",
  damageProfile: {
    kind: "ayaka",
    talentLabel: "战技 / 爆发等级",
    controls: [
      {
        key: "ayakaDashBonus",
        label: "霰步被动",
        defaultValue: "active",
        options: [
          { value: "active", label: "已触发（冰伤 +18%）" },
          { value: "inactive", label: "未触发" },
        ],
      },
    ],
    skillMultipliers: [
      2.392, 2.5714, 2.7508, 2.99, 3.1694, 3.3488, 3.588, 3.8272,
      4.0664, 4.3056,
    ],
    burstCutMultipliers: [
      1.123, 1.207225, 1.29145, 1.40375, 1.487975, 1.5722, 1.6845,
      1.7968, 1.9091, 2.0214,
    ],
    burstBloomMultipliers: [
      1.6845, 1.810837, 1.937175, 2.105625, 2.231962, 2.3583, 2.52675,
      2.6952, 2.86365, 3.0321,
    ],
  },
};
