import type { CharacterPreset } from "./types.ts";
import { hpStateOptions } from "../common.ts";

export const hutao: CharacterPreset = {
  id: "hutao",
  name: "胡桃",
  level: 90,
  baseHp: 15552,
  baseAtk: 106,
  baseDef: 876,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "pyro",
  weaponType: "polearm",
  defaultWeaponId: "homa",
  damageProfile: {
    kind: "hutao",
    talentLabel: "普攻 / 战技 / 爆发等级",
    controls: [
      {
        key: "hutaoHpState",
        label: "当前生命值",
        defaultValue: "below50",
        options: hpStateOptions,
      },
    ],
    chargedMultipliers: [
      1.3596, 1.4523, 1.545, 1.6686, 1.7613, 1.86945, 2.0085, 2.14755,
      2.2866, 2.42565,
    ],
    skillHpToAtkRatios: [
      0.03841, 0.04071, 0.04301, 0.046, 0.0483, 0.0506, 0.05359,
      0.05658, 0.05957, 0.06256,
    ],
    burstMultipliers: [
      3.03272, 3.21432, 3.39592, 3.632, 3.8136, 3.9952, 4.23128,
      4.46736, 4.70344, 4.93952,
    ],
    lowHpBurstMultipliers: [
      3.7909, 4.0179, 4.2449, 4.54, 4.767, 4.994, 5.2891, 5.5842,
      5.8793, 6.1744,
    ],
  },
};
