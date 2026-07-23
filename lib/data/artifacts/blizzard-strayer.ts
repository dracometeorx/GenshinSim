import type { ArtifactSetPreset } from "./types.ts";

export const blizzardStrayer: ArtifactSetPreset = {
  id: "blizzard-strayer",
  name: "冰风迷途的勇士",
  shortName: "冰风",
  twoPiece: {
    description: "获得 15% 冰元素伤害加成。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalDmg",
        value: 15,
        element: "cryo",
      },
    ],
  },
  fourPiece: {
    description:
      "攻击处于冰元素影响下的敌人时，暴击率提高 20%；若敌人被冻结，再额外提高 20%。",
    control: {
      key: "blizzardEnemyState",
      label: "敌人状态",
      defaultValue: "frozen",
      options: [
        { value: "none", label: "无冰附着" },
        {
          value: "cryo",
          label: "冰元素影响",
          modifiers: [
            { kind: "stat", stat: "critRate", value: 20 },
          ],
        },
        {
          value: "frozen",
          label: "冻结状态",
          modifiers: [
            { kind: "stat", stat: "critRate", value: 40 },
          ],
        },
      ],
    },
  },
};
