import type { ArtifactSetPreset } from "./types.ts";

function recordedHealing(state: string | undefined) {
  const value = Number(state ?? "15000");
  return Number.isFinite(value)
    ? Math.min(15000, Math.max(0, value))
    : 15000;
}

export const songOfDaysPast: ArtifactSetPreset = {
  id: "song-of-days-past",
  name: "昔时之歌",
  shortName: "昔时",
  twoPiece: {
    description: "治疗加成提高 15%。",
    modifiers: [
      {
        kind: "stat",
        stat: "healingBonus",
        value: 15,
      },
    ],
  },
  fourPiece: {
    description:
      "记录 6 秒内的治疗量（至多 15000），随后使当前场上角色的下一次攻击获得记录量 8% 的基础伤害提升，最多生效 5 次。",
    control: {
      key: "songOfDaysPastHealing",
      label: "渴盼记录治疗量",
      defaultValue: "15000",
      options: [
        { value: "0", label: "未记录 / 未生效" },
        {
          value: "5000",
          label: "记录 5000 · 基础伤害 +400",
          modifiers: [
            {
              kind: "additiveBaseDamage",
              value: 400,
            },
          ],
        },
        {
          value: "10000",
          label: "记录 10000 · 基础伤害 +800",
          modifiers: [
            {
              kind: "additiveBaseDamage",
              value: 800,
            },
          ],
        },
        {
          value: "15000",
          label: "记录 15000 · 基础伤害 +1200",
          modifiers: [
            {
              kind: "additiveBaseDamage",
              value: 1200,
            },
          ],
        },
      ],
    },
    panelNote:
      "伤害结果按一次「彼时的浪潮」生效计算；持续时间与剩余次数不模拟。",
  },
  teamBuffs: [
    {
      id: "song-of-days-past-wave",
      name: "昔时之歌四件套",
      description:
        "下一次命中获得记录治疗量 8% 的基础伤害提升，单次至多 1200。",
      stackingGroup: "song-of-days-past-wave",
      minArtifactPieces: 4,
      evaluate: ({ source }) => {
        const value =
          recordedHealing(
            source.artifactSelections.songOfDaysPastHealing,
          ) * 0.08;
        return value
          ? [
              {
                kind: "damage",
                stat: "additiveBaseDamage",
                value,
              },
            ]
          : [];
      },
    },
  ],
};
