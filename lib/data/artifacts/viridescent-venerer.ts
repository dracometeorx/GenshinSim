import type { ElementKey } from "../../calculator.ts";
import type { ArtifactSetPreset } from "./types.ts";

const swirlElements: ElementKey[] = [
  "pyro",
  "hydro",
  "electro",
  "cryo",
];

function selectedSwirlElement(
  selections: Readonly<Record<string, string>>,
) {
  const selected = selections.viridescentSwirlElement;
  return swirlElements.find((element) => element === selected);
}

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
      "扩散反应造成的伤害提升 60%，并使敌人对扩散元素的抗性降低 40%，持续 10 秒。",
    control: {
      key: "viridescentSwirlElement",
      label: "风套扩散元素",
      defaultValue: "inactive",
      options: [
        { value: "inactive", label: "未触发扩散" },
        { value: "pyro", label: "扩散火元素" },
        { value: "hydro", label: "扩散水元素" },
        { value: "electro", label: "扩散雷元素" },
        { value: "cryo", label: "扩散冰元素" },
      ],
    },
    evaluateModifiers: ({ selections }) => {
      const element = selectedSwirlElement(selections);
      return element
        ? [
            {
              kind: "enemyResistanceReduction",
              value: 40,
              element,
            },
          ]
        : [];
    },
    panelNote:
      "计算器不计算扩散剧变伤害；这里只计入所选扩散元素的 40% 减抗。",
  },
  teamBuffs: [
    {
      id: "viridescent-venerer-resistance",
      name: "翠绿之影四件套",
      description: "扩散后使敌人对应元素抗性降低 40%。",
      stackingGroup: "viridescent-venerer-resistance",
      minArtifactPieces: 4,
      evaluate: ({ source, target }) =>
        selectedSwirlElement(source.artifactSelections) ===
        target.element
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                element: target.element,
                value: 40,
              },
            ]
          : [],
    },
  ],
};
