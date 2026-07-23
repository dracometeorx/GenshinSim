import type { ArtifactSetPreset } from "./types.ts";

export const emblem: ArtifactSetPreset = {
  id: "emblem",
  name: "绝缘之旗印",
  shortName: "绝缘",
  twoPiece: {
    description: "元素充能效率提高 20%。",
    modifiers: [
      { kind: "stat", stat: "energyRecharge", value: 20 },
    ],
  },
  fourPiece: {
    description:
      "基于元素充能效率的 25% 提高元素爆发伤害，至多获得 75% 提升。",
    modifiers: [
      {
        kind: "burstFromEnergyRecharge",
        ratio: 0.25,
        max: 75,
      },
    ],
  },
};
