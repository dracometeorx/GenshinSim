import type { ArtifactSetPreset } from "./types.ts";

export const celestialGift: ArtifactSetPreset = {
  id: "celestial-gift",
  name: "天之美赐",
  shortName: "天赐",
  twoPiece: {
    description: "元素充能效率提高 20%。",
    modifiers: [
      { kind: "stat", stat: "energyRecharge", value: 20 },
    ],
  },
  fourPiece: {
    description:
      "已完成魔女课业的装备者施放元素战技后，使队伍获得其元素对应的 20% 元素伤害加成；魔导·秘仪时，装备者与前台角色对应元素的加成提高至 40%。",
    control: {
      key: "celestialGiftState",
      label: "天赐四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未施放战技 / 效果未生效" },
        { value: "active", label: "施放战技后效果生效" },
      ],
    },
    evaluateModifiers: ({
      characterElement,
      hexereiSecretRite,
      selections,
      witchHomeworkCompleted,
    }) => {
      if (
        !witchHomeworkCompleted ||
        selections.celestialGiftState === "inactive"
      ) {
        return [];
      }
      return [
        {
          kind: "stat",
          stat: "elementalDmg",
          value: hexereiSecretRite ? 40 : 20,
          element: characterElement,
        },
      ];
    },
    panelNote:
      "默认所有魔导目录角色均已完成课业；魔导·秘仪由队伍中至少两名魔导角色自动判定。",
  },
  teamBuffs: [
    {
      id: "celestial-gift-elemental-damage",
      name: "天之美赐四件套",
      description:
        "施放元素战技后提供元素伤害加成；魔导·秘仪时，当前角色对应元素获得 40%。",
      stackingGroup: "celestial-gift-elemental-damage",
      minArtifactPieces: 4,
      evaluate: ({ source, target, party }) => {
        if (
          !source.hexerei ||
          source.artifactSelections.celestialGiftState ===
            "inactive"
        ) {
          return [];
        }
        if (!party.hexereiSecretRite && source.element !== target.element) {
          return [];
        }
        return [
          {
            kind: "panel",
            stat: "elementalDmg",
            value: party.hexereiSecretRite ? 40 : 20,
          },
        ];
      },
    },
  ],
};
