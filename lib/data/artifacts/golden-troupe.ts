import type { ArtifactSetPreset } from "./types.ts";

export const goldenTroupe: ArtifactSetPreset = {
  id: "golden-troupe",
  name: "黄金剧团",
  shortName: "剧团",
  twoPiece: {
    description: "元素战技造成的伤害提升 20%。",
    modifiers: [
      { kind: "damageBonus", category: "skill", value: 20 },
    ],
  },
  fourPiece: {
    description:
      "元素战技造成的伤害提升 25%；处于队伍后台时，元素战技伤害进一步提升 25%，该效果在登场 2 秒后移除。",
    modifiers: [
      { kind: "damageBonus", category: "skill", value: 25 },
    ],
    control: {
      key: "goldenTroupeState",
      label: "剧团四件套状态",
      defaultValue: "offField",
      options: [
        {
          value: "onField",
          label: "前台超过 2 秒 · 战技合计 +45%",
        },
        {
          value: "offField",
          label: "后台 / 登场未满 2 秒 · 战技合计 +70%",
          modifiers: [
            {
              kind: "damageBonus",
              category: "skill",
              value: 25,
            },
          ],
        },
      ],
    },
    panelNote:
      "两件套与四件套基础效果合计 45%；后台状态再计入 25%。",
  },
};
