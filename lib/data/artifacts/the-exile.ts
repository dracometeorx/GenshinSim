import type { ArtifactSetPreset } from "./types.ts";

export const theExile: ArtifactSetPreset = {
  id: "the-exile",
  name: "流放者",
  shortName: "流放",
  twoPiece: {
    description: "元素充能效率提高 20%。",
    modifiers: [
      {
        kind: "stat",
        stat: "energyRecharge",
        value: 20,
      },
    ],
  },
  fourPiece: {
    description:
      "施放元素爆发后，每 2 秒为队伍中其他角色恢复 2 点元素能量，持续 6 秒。",
    panelNote:
      "固定回能不等同于元素充能效率，不写入队友面板或单次伤害。",
  },
};
