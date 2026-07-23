import type { CharacterPreset } from "./types.ts";

export const raiden: CharacterPreset = {
  id: "raiden",
  name: "雷电将军",
  level: 90,
  baseHp: 12907,
  baseAtk: 337,
  baseDef: 789,
  ascensionStat: "energyRecharge",
  ascensionValue: 32,
  ascensionLabel: "元素充能效率 +32%",
  element: "electro",
  weaponType: "polearm",
  defaultWeaponId: "engulfing",
  damageProfile: {
    kind: "raiden",
    talentLabel: "战技 / 爆发等级",
    controls: [
      {
        key: "raidenResolveStacks",
        label: "愿力层数",
        defaultValue: "60",
        options: [0, 10, 20, 30, 40, 50, 60].map((value) => ({
          value: String(value),
          label: `${value} 层`,
        })),
      },
      {
        key: "raidenEyeState",
        label: "恶曜之眼",
        defaultValue: "active",
        options: [
          { value: "active", label: "已开启" },
          { value: "inactive", label: "未开启" },
        ],
      },
    ],
    burstMultipliers: [
      4.008, 4.3086, 4.6092, 5.01, 5.3106, 5.6112, 6.012, 6.4128,
      6.8136, 7.2144,
    ],
    resolvePerStackMultipliers: [
      0.03888, 0.041796, 0.044712, 0.0486, 0.051516, 0.054432, 0.05832,
      0.062208, 0.066096, 0.069984,
    ],
    eyeBurstBonusPerEnergy: [
      0.0022, 0.0023, 0.0024, 0.0025, 0.0026, 0.0027, 0.0028, 0.0029,
      0.003, 0.003,
    ],
    burstEnergyCost: 90,
  },
};
