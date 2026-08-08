import type { ArtifactModifier, ArtifactSetPreset } from "./types.ts";

function gildedModifiers(
  sameElementTeammates: number,
  differentElementTeammates: number,
): ArtifactModifier[] {
  return [
    ...(sameElementTeammates
      ? [
          {
            kind: "stat" as const,
            stat: "atkPct" as const,
            value: sameElementTeammates * 14,
          },
        ]
      : []),
    ...(differentElementTeammates
      ? [
          {
            kind: "stat" as const,
            stat: "elementalMastery" as const,
            value: differentElementTeammates * 50,
          },
        ]
      : []),
  ];
}

export const gildedDreams: ArtifactSetPreset = {
  id: "gilded-dreams",
  name: "饰金之梦",
  shortName: "饰金",
  twoPiece: {
    description: "元素精通提高 80 点。",
    modifiers: [
      { kind: "stat", stat: "elementalMastery", value: 80 },
    ],
  },
  fourPiece: {
    description:
      "触发元素反应后的 8 秒内，每名与装备者元素相同的队友使攻击力提高 14%，每名元素不同的队友使元素精通提高 50 点，两类效果均至多计算三名角色。",
    control: {
      key: "gildedDreamsTeam",
      label: "饰金四件套队伍构成",
      defaultValue: "same0Different3",
      options: [
        { value: "inactive", label: "未触发元素反应" },
        {
          value: "same0Different3",
          label: "0 同元素 / 3 异元素 · 精通 +150",
          modifiers: gildedModifiers(0, 3),
        },
        {
          value: "same1Different2",
          label: "1 同元素 / 2 异元素 · 攻击 +14% / 精通 +100",
          modifiers: gildedModifiers(1, 2),
        },
        {
          value: "same2Different1",
          label: "2 同元素 / 1 异元素 · 攻击 +28% / 精通 +50",
          modifiers: gildedModifiers(2, 1),
        },
        {
          value: "same3Different0",
          label: "3 同元素 / 0 异元素 · 攻击 +42%",
          modifiers: gildedModifiers(3, 0),
        },
      ],
    },
    panelNote:
      "队伍构成只统计装备者以外的三名角色；本版按所选构成计算，不模拟 8 秒持续时间与触发间隔。",
  },
};
