import type { ArtifactSetPreset } from "./types.ts";

export const instructor: ArtifactSetPreset = {
  id: "instructor",
  name: "教官",
  shortName: "教官",
  twoPiece: {
    description: "元素精通提高 80 点。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalMastery",
        value: 80,
      },
    ],
  },
  fourPiece: {
    description:
      "触发元素反应后，队伍中所有角色的元素精通提高 120 点，持续 8 秒。",
    control: {
      key: "instructorState",
      label: "教官四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发元素反应" },
        {
          value: "active",
          label: "触发反应后 · 全队精通 +120",
          modifiers: [
            {
              kind: "stat",
              stat: "elementalMastery",
              value: 120,
            },
          ],
        },
      ],
    },
  },
  teamBuffs: [
    {
      id: "instructor-party-mastery",
      name: "教官四件套",
      description:
        "装备者触发元素反应后，全队元素精通提高 120 点。",
      stackingGroup: "instructor-party-mastery",
      minArtifactPieces: 4,
      contributesToBuffSourcePanel: true,
      evaluate: ({ source }) =>
        source.artifactSelections.instructorState === "inactive"
          ? []
          : [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: 120,
              },
            ],
    },
  ],
};
