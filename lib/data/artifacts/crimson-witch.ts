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
      "蒸发、融化反应加成提高 15%；施放元素战技后可额外叠加反应加成，最多 3 层。",
    modifiers: [
      {
        kind: "reactionBonus",
        value: 15,
        reactions: ["vaporize", "melt"],
      },
    ],
    panelNote:
      "二件套火伤写入面板；四件套反应加成计入元素精通所在的反应倍率层。",
    control: {
      key: "crimsonWitchStacks",
      label: "魔女套层数",
      defaultValue: "0",
      options: [
        { value: "0", label: "0 层 · 反应加成 15%" },
        {
          value: "1",
          label: "1 层 · 反应加成 22.5%",
          modifiers: [
            {
              kind: "reactionBonus",
              value: 7.5,
              reactions: ["vaporize", "melt"],
            },
          ],
        },
        {
          value: "2",
          label: "2 层 · 反应加成 30%",
          modifiers: [
            {
              kind: "reactionBonus",
              value: 15,
              reactions: ["vaporize", "melt"],
            },
          ],
        },
        {
          value: "3",
          label: "3 层 · 反应加成 37.5%",
          modifiers: [
            {
              kind: "reactionBonus",
              value: 22.5,
              reactions: ["vaporize", "melt"],
            },
          ],
        },
      ],
    },
  },
};
