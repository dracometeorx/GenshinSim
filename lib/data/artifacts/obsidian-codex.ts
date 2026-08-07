import type { ArtifactSetPreset } from "./types.ts";

export const obsidianCodex: ArtifactSetPreset = {
  id: "obsidian-codex",
  name: "黑曜秘典",
  shortName: "黑曜",
  twoPiece: {
    description:
      "装备者处于夜魂加持状态且在场上时，造成的伤害提高 15%。",
    modifiers: [{ kind: "damageBonus", value: 15 }],
  },
  fourPiece: {
    description:
      "装备者在场上消耗夜魂值后，暴击率提高 40%，持续 6 秒。",
    control: {
      key: "obsidianCodexState",
      label: "黑曜四件套状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未消耗夜魂值" },
        {
          value: "active",
          label: "已消耗夜魂值 · 暴击率 +40%",
          modifiers: [
            { kind: "stat", stat: "critRate", value: 40 },
          ],
        },
      ],
    },
    panelNote:
      "两件套按夜魂加持且在场的有效状态计算；四件套暴击率由状态选项控制。",
  },
};
