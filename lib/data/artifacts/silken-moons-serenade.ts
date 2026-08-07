import type { ArtifactSetPreset } from "./types.ts";

function partyMastery(level: "none" | "nascent" | "ascendant") {
  if (level === "ascendant") return 120;
  if (level === "nascent") return 60;
  return 0;
}

export const silkenMoonsSerenade: ArtifactSetPreset = {
  id: "silken-moons-serenade",
  name: "纺月的夜歌",
  shortName: "纺月",
  twoPiece: {
    description: "元素充能效率提高 20%。",
    modifiers: [
      { kind: "stat", stat: "energyRecharge", value: 20 },
    ],
  },
  fourPiece: {
    description:
      "造成元素伤害后获得月辉明光·崇信：根据月兆提高全队元素精通，并提供月曜反应伤害加成。",
    evaluateModifiers: ({ moonsignLevel }) => {
      const mastery = partyMastery(moonsignLevel);
      return mastery
        ? [
            {
              kind: "stat",
              stat: "elementalMastery",
              value: mastery,
            },
            { kind: "lunarDamageBonus", value: 10 },
          ]
        : [];
    },
    panelNote:
      "月兆由当前角色与三名队友自动推导；同名月辉明光效果不叠加。",
  },
  teamBuffs: [
    {
      id: "silken-moon-devotion",
      name: "月辉明光·崇信",
      description:
        "初辉/满辉时为全队提供 60/120 元素精通，并提高月曜反应伤害。",
      stackingGroup: "gleaming-moon-devotion",
      minArtifactPieces: 4,
      contributesToBuffSourcePanel: true,
      evaluate: ({ party }) => {
        const mastery = partyMastery(party.moonsignLevel);
        return mastery
          ? [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: mastery,
              },
              {
                kind: "damage",
                stat: "lunarReactionDamageBonus",
                value: 10,
              },
            ]
          : [];
      },
    },
  ],
};
