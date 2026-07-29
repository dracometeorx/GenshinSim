import type { ArtifactSetPreset } from "./types.ts";

function scrollBonus(state: string | undefined) {
  if (state === "inactive") return 0;
  if (state === "reaction") return 12;
  return 40;
}

export const scrollOfTheHeroOfCinderCity: ArtifactSetPreset = {
  id: "scroll-of-the-hero-of-cinder-city",
  name: "烬城勇者绘卷",
  shortName: "烬城",
  twoPiece: {
    description:
      "队伍中附近的角色触发夜魂迸发时，装备者恢复 6 点元素能量。",
    panelNote: "固定回能不等同于元素充能效率，不写入面板。",
  },
  fourPiece: {
    description:
      "装备者触发相关元素反应后，全队与该反应相关的元素伤害加成提高 12%；若装备者处于夜魂加持状态，合计提高 40%。",
    control: {
      key: "cinderCityState",
      label: "烬城四件套",
      defaultValue: "nightsoul",
      options: [
        { value: "inactive", label: "未触发相关反应" },
        {
          value: "reaction",
          label: "触发反应 · 相关元素伤害 +12%",
          modifiers: [
            {
              kind: "damageBonus",
              value: 12,
            },
          ],
        },
        {
          value: "nightsoul",
          label: "夜魂加持触发 · 相关元素伤害 +40%",
          modifiers: [
            {
              kind: "damageBonus",
              value: 40,
            },
          ],
        },
      ],
    },
    panelNote:
      "队友方案应按装备者触发反应时的状态选择；仅在当前角色属于该反应相关元素时启用队伍增益。",
  },
  teamBuffs: [
    {
      id: "cinder-city-elemental-damage",
      name: "烬城勇者绘卷四件套",
      description:
        "按队友方案所选状态，使当前反应相关元素伤害提高 12% 或 40%。",
      stackingGroup: "cinder-city-elemental-damage",
      minArtifactPieces: 4,
      evaluate: ({ source }) => {
        const value = scrollBonus(
          source.artifactSelections.cinderCityState,
        );
        return value
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                value,
              },
            ]
          : [];
      },
    },
  ],
};
