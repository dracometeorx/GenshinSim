import type { ArtifactSetPreset } from "./types.ts";

export const marechausseeHunter: ArtifactSetPreset = {
  id: "marechaussee-hunter",
  name: "逐影猎人",
  shortName: "逐影",
  twoPiece: {
    description: "普通攻击与重击造成的伤害提高 15%。",
    modifiers: [
      { kind: "damageBonus", category: "normal", value: 15 },
      { kind: "damageBonus", category: "charged", value: 15 },
    ],
  },
  fourPiece: {
    description:
      "当前生命值提升或降低时，暴击率提高 12%，持续 5 秒，至多叠加 3 次。",
    control: {
      key: "marechausseeHunterStacks",
      label: "逐影四件套层数",
      defaultValue: "3",
      options: [0, 1, 2, 3].map((stacks) => ({
        value: String(stacks),
        label: `${stacks} 层${stacks ? ` · 暴击率 +${stacks * 12}%` : ""}`,
        modifiers: stacks
          ? [
              {
                kind: "stat" as const,
                stat: "critRate" as const,
                value: stacks * 12,
              },
            ]
          : [],
      })),
    },
  },
};
