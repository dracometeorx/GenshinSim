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
      "施放元素战技后，二件套效果提高 50%，最多叠加 3 次；同时提高相关火元素反应伤害。",
    panelNote: "当前计入火元素伤害；反应加成留待伤害公式。",
    control: {
      key: "crimsonWitchStacks",
      label: "魔女套层数",
      defaultValue: "0",
      options: [
        { value: "0", label: "0 层" },
        {
          value: "1",
          label: "1 层",
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
          label: "2 层",
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
          label: "3 层",
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
