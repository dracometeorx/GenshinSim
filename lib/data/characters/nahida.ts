import type { CharacterPreset } from "./types.ts";

export const nahida: CharacterPreset = {
  id: "nahida",
  name: "纳西妲",
  level: 90,
  baseHp: 10360,
  baseAtk: 299,
  baseDef: 630,
  ascensionStat: "elementalMastery",
  ascensionValue: 115.2,
  ascensionLabel: "元素精通 +115.2",
  element: "dendro",
  weaponType: "catalyst",
  defaultWeaponId: "dreams",
  damageProfile: {
    kind: "nahida",
    talentLabel: "元素战技等级",
    controls: [],
    triKarmaAtkMultipliers: [
      1.032, 1.1094, 1.1868, 1.29, 1.3674, 1.4448, 1.548, 1.6512,
      1.7544, 1.8576,
    ],
    triKarmaEmMultipliers: [
      2.064, 2.2188, 2.3736, 2.58, 2.7348, 2.8896, 3.096, 3.3024,
      3.5088, 3.7152,
    ],
  },
};
