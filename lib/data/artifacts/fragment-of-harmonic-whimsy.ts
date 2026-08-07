import type { ArtifactSetPreset } from "./types.ts";

export const fragmentOfHarmonicWhimsy: ArtifactSetPreset = {
  id: "fragment-of-harmonic-whimsy",
  name: "谐律异想断章",
  shortName: "谐律",
  twoPiece: {
    description: "攻击力提高 18%。",
    modifiers: [{ kind: "stat", stat: "atkPct", value: 18 }],
  },
  fourPiece: {
    description:
      "生命之契提升或降低时，造成的伤害提高 18%，持续 6 秒，至多叠加 3 次。",
    control: {
      key: "harmonicWhimsyStacks",
      label: "谐律四件套层数",
      defaultValue: "3",
      options: [0, 1, 2, 3].map((stacks) => ({
        value: String(stacks),
        label: `${stacks} 层${stacks ? ` · 伤害 +${stacks * 18}%` : ""}`,
        modifiers: stacks
          ? [{ kind: "damageBonus" as const, value: stacks * 18 }]
          : [],
      })),
    },
  },
};
