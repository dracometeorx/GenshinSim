import type { ArtifactSetPreset } from "./types.ts";

export const crimsonWitch: ArtifactSetPreset = {
  id: "crimson-witch",
  name: "炽烈的炎之魔女",
  shortName: "魔女",
  twoPiece: {
    description: "获得 15% 火元素伤害加成。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalDmg",
        value: 15,
        element: "pyro",
      },
    ],
  },
  fourPiece: {
    description:
      "蒸发、融化反应加成提高 15%；施放元素战技后，二件套火伤效果提高 50%，最多叠加 3 层。",
    modifiers: [
      {
        kind: "reactionBonus",
        value: 15,
        reactions: ["vaporize", "melt"],
      },
    ],
    panelNote:
      "固定 15% 反应加成计入反应倍率层；每层额外获得 7.5% 火元素伤害加成。",
    control: {
      key: "crimsonWitchStacks",
      label: "魔女套层数",
      defaultValue: "0",
      options: [
        { value: "0", label: "0 层 · 反应加成 15%" },
        {
          value: "1",
          label: "1 层 · 额外火伤 7.5%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              value: 7.5,
              element: "pyro",
            },
          ],
        },
        {
          value: "2",
          label: "2 层 · 额外火伤 15%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              value: 15,
              element: "pyro",
            },
          ],
        },
        {
          value: "3",
          label: "3 层 · 额外火伤 22.5%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              value: 22.5,
              element: "pyro",
            },
          ],
        },
      ],
    },
  },
};
