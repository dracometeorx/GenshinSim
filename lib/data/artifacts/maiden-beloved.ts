import type { ArtifactSetPreset } from "./types.ts";

export const maidenBeloved: ArtifactSetPreset = {
  id: "maiden-beloved",
  name: "被怜爱的少女",
  shortName: "少女",
  twoPiece: {
    description: "角色造成的治疗效果提升 15%。",
    modifiers: [
      {
        kind: "stat",
        stat: "healingBonus",
        value: 15,
      },
    ],
  },
  fourPiece: {
    description:
      "施放元素战技或元素爆发后的 10 秒内，全队受治疗效果加成提高 20%。",
    panelNote:
      "受治疗加成不改变角色造成治疗的面板，也不直接进入单次伤害计算。",
  },
};
