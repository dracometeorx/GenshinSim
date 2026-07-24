import type { ArtifactSetPreset } from "./types.ts";

export const deepwood: ArtifactSetPreset = {
  id: "deepwood",
  name: "深林的记忆",
  shortName: "深林",
  twoPiece: {
    description: "获得 15% 草元素伤害加成。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalDmg",
        value: 15,
        element: "dendro",
      },
    ],
  },
  fourPiece: {
    description:
      "元素战技或元素爆发命中后，使目标的草元素抗性降低 30%，持续 8 秒。",
    modifiers: [
      {
        kind: "enemyResistanceReduction",
        value: 30,
        element: "dendro",
      },
    ],
    panelNote: "降低的是敌人抗性，不会显示在角色面板中。",
  },
  teamBuffs: [
    {
      id: "deepwood-dendro-resistance",
      name: "深林四件套",
      description:
        "队友元素战技或元素爆发命中后，使敌人草元素抗性降低 30%。",
      stackingGroup: "deepwood-dendro-resistance",
      minArtifactPieces: 4,
      evaluate: ({ target }) =>
        target.element === "dendro"
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                element: "dendro",
                value: 30,
              },
            ]
          : [],
    },
  ],
};
