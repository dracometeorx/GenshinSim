import type { ArtifactSetPreset } from "./types.ts";

export const noblesseOblige: ArtifactSetPreset = {
  id: "noblesse-oblige",
  name: "昔日宗室之仪",
  shortName: "宗室",
  twoPiece: {
    description: "元素爆发造成的伤害提升 20%。",
    modifiers: [
      {
        kind: "damageBonus",
        category: "burst",
        value: 20,
      },
    ],
  },
  fourPiece: {
    description:
      "施放元素爆发后，队伍中所有角色攻击力提升 20%，持续 12 秒；该效果不可叠加。",
    control: {
      key: "noblesseState",
      label: "宗室四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未施放元素爆发" },
        {
          value: "active",
          label: "爆发后 · 全队攻击力 +20%",
          modifiers: [
            {
              kind: "stat",
              stat: "atkPct",
              value: 20,
            },
          ],
        },
      ],
    },
  },
  teamBuffs: [
    {
      id: "noblesse-party-attack",
      name: "昔日宗室之仪四件套",
      description:
        "装备者施放元素爆发后，全队攻击力提高 20%。",
      stackingGroup: "noblesse-party-attack",
      minArtifactPieces: 4,
      evaluate: ({ source }) =>
        source.artifactSelections.noblesseState === "inactive"
          ? []
          : [{ kind: "panel", stat: "atkPct", value: 20 }],
    },
  ],
};
