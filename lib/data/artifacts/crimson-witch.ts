import type { ArtifactSetPreset } from "./types.ts";

export const crimsonWitch: ArtifactSetPreset = {
  id: "crimson-witch",
  name: "炽烈的炎之魔女",
  shortName: "魔女",
  twoPiece: {
    description: "获得 15% 火元素伤害加成。",
    modifiers: [
      {
        kind: "damageBonus",
        value: 15,
        element: "pyro",
      },
    ],
  },
  fourPiece: {
    description:
      "施放元素战技后，二件套效果提高 50%，最多叠加 3 次；同时提高相关火元素反应伤害。",
    panelNote: "火伤与反应增幅仅用于最终技能伤害，不写入最终面板。",
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
              kind: "damageBonus",
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
              kind: "damageBonus",
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
              kind: "damageBonus",
              value: 22.5,
              element: "pyro",
            },
          ],
        },
      ],
    },
  },
};
