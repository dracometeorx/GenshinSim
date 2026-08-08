import type { ArtifactSetPreset } from "./types.ts";

const supportedElements = [
  "pyro",
  "hydro",
  "electro",
  "cryo",
  "geo",
] as const;

export const archaicPetra: ArtifactSetPreset = {
  id: "archaic-petra",
  name: "悠古的磐岩",
  shortName: "磐岩",
  twoPiece: {
    description: "获得 15% 岩元素伤害加成。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalDmg",
        element: "geo",
        value: 15,
      },
    ],
  },
  fourPiece: {
    description:
      "获得结晶反应形成的晶片或触发月结晶反应时，全队获得 35% 对应元素伤害加成，持续 10 秒；同时只能获得一种。",
    control: {
      key: "archaicPetraElement",
      label: "磐岩四件套对应元素",
      defaultValue: "inactive",
      options: [
        { value: "inactive", label: "未拾取晶片 / 未触发" },
        {
          value: "pyro",
          label: "火元素伤害 +35%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              element: "pyro",
              value: 35,
            },
          ],
        },
        {
          value: "hydro",
          label: "水元素伤害 +35%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              element: "hydro",
              value: 35,
            },
          ],
        },
        {
          value: "electro",
          label: "雷元素伤害 +35%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              element: "electro",
              value: 35,
            },
          ],
        },
        {
          value: "cryo",
          label: "冰元素伤害 +35%",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              element: "cryo",
              value: 35,
            },
          ],
        },
        {
          value: "geo",
          label: "岩元素伤害 +35%（月结晶）",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalDmg",
              element: "geo",
              value: 35,
            },
          ],
        },
      ],
    },
    panelNote:
      "队友装备时，选择当前伤害角色实际获得的对应元素；同一时间只计算一种元素。",
  },
  teamBuffs: [
    {
      id: "archaic-petra-elemental-damage",
      name: "悠古的磐岩四件套",
      description:
        "拾取对应结晶晶片或触发月结晶后，全队对应元素伤害提高 35%。",
      stackingGroup: "archaic-petra-elemental-damage",
      minArtifactPieces: 4,
      evaluate: ({ source, target }) => {
        const element =
          source.artifactSelections.archaicPetraElement;
        return supportedElements.includes(
          element as (typeof supportedElements)[number],
        ) && element === target.element
          ? [
              {
                kind: "panel",
                stat: "elementalDmg",
                value: 35,
              },
            ]
          : [];
      },
    },
  ],
};
