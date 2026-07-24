import type { ArtifactSetPreset } from "./types.ts";

function moonsignCrit(level: "none" | "nascent" | "ascendant") {
  if (level === "ascendant") return 30;
  if (level === "nascent") return 15;
  return 0;
}

export const nightOfSkysUnveiling: ArtifactSetPreset = {
  id: "night-of-skys-unveiling",
  name: "穹境示现之夜",
  shortName: "穹境",
  twoPiece: {
    description: "元素精通提高 80 点。",
    modifiers: [
      { kind: "stat", stat: "elementalMastery", value: 80 },
    ],
  },
  fourPiece: {
    description:
      "当前场上时，附近触发月曜反应后，根据初辉/满辉提高 15%/30% 暴击率，并形成独立月辉明光效果。",
    evaluateModifiers: ({ moonsignLevel, selections }) => {
      if (selections.nightOfSkyState === "inactive") return [];
      const critRate = moonsignCrit(moonsignLevel);
      return critRate
        ? [
            { kind: "stat", stat: "critRate", value: critRate },
            { kind: "lunarDamageBonus", value: 10 },
          ]
        : [];
    },
    control: {
      key: "nightOfSkyState",
      label: "穹境四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发月曜反应" },
        { value: "active", label: "前台已触发" },
      ],
    },
    panelNote: "暴击率档位由队伍月兆自动决定。",
  },
  teamBuffs: [
    {
      id: "night-of-sky-gleaming-moon",
      name: "月辉明光·意念",
      description:
        "形成另一种月辉明光效果，为队伍增加一层月曜反应伤害加成。",
      stackingGroup: "gleaming-moon-intention",
      minArtifactPieces: 4,
      evaluate: ({ party, source }) =>
        party.moonsignLevel === "none" ||
        source.artifactSelections.nightOfSkyState === "inactive"
          ? []
          : [
              {
                kind: "damage",
                stat: "lunarReactionDamageBonus",
                value: 10,
              },
            ],
    },
  ],
};
