import type { ArtifactSetPreset } from "./types.ts";

export const shimenawa: ArtifactSetPreset = {
  id: "shimenawa",
  name: "追忆之注连",
  shortName: "追忆",
  twoPiece: {
    description: "攻击力提高 18%。",
    modifiers: [
      {
        kind: "stat",
        stat: "atkPct",
        value: 18,
      },
    ],
  },
  fourPiece: {
    description:
      "施放元素战技时，若元素能量不少于 15 点，则流失 15 点能量，并使普通攻击、重击与下落攻击伤害提高 50%，持续 10 秒。",
    panelNote:
      "仅计算伤害加成；本版不模拟能量扣除、持续时间与重复触发限制。",
    control: {
      key: "shimenawaState",
      label: "四件套状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发" },
        {
          value: "active",
          label: "已触发（普攻 / 重击 / 下落 +50%）",
          modifiers: [
            {
              kind: "damageBonus",
              category: "normal",
              value: 50,
            },
            {
              kind: "damageBonus",
              category: "charged",
              value: 50,
            },
            {
              kind: "damageBonus",
              category: "plunge",
              value: 50,
            },
          ],
        },
      ],
    },
  },
};
