import type { ArtifactSetPreset } from "./types.ts";

export const viridescentVenerer: ArtifactSetPreset = {
  id: "viridescent-venerer",
  name: "翠绿之影",
  shortName: "风套",
  twoPiece: {
    description: "获得 15% 风元素伤害加成。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalDmg",
        value: 15,
        element: "anemo",
      },
    ],
  },
  fourPiece: {
    description:
      "扩散反应造成的伤害提升 60%；计算器简化为直接降低敌人火、水、雷、冰元素抗性 40%。",
    modifiers: [
      {
        kind: "enemyResistanceReduction",
        value: 40,
        element: "pyro",
      },
      {
        kind: "enemyResistanceReduction",
        value: 40,
        element: "hydro",
      },
      {
        kind: "enemyResistanceReduction",
        value: 40,
        element: "electro",
      },
      {
        kind: "enemyResistanceReduction",
        value: 40,
        element: "cryo",
      },
    ],
    panelNote:
      "计算器不计算扩散剧变伤害；装备四件套时直接计入火、水、雷、冰元素的 40% 减抗，队友装备时同样生效但多套不叠加。",
  },
  teamBuffs: [
    {
      id: "viridescent-venerer-resistance",
      name: "翠绿之影四件套",
      description:
        "直接降低敌人火、水、雷、冰元素抗性 40%；多套翠绿之影不叠加。",
      stackingGroup: "viridescent-venerer-resistance",
      minArtifactPieces: 4,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: 40,
          element: "pyro",
        },
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: 40,
          element: "hydro",
        },
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: 40,
          element: "electro",
        },
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: 40,
          element: "cryo",
        },
      ],
    },
  ],
};
