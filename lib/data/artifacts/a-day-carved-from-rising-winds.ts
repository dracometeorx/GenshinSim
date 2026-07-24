import type { ArtifactSetPreset } from "./types.ts";

export const aDayCarvedFromRisingWinds: ArtifactSetPreset = {
  id: "a-day-carved-from-rising-winds",
  name: "风起之日",
  shortName: "风起",
  twoPiece: {
    description: "攻击力提高 18%。",
    modifiers: [{ kind: "stat", stat: "atkPct", value: 18 }],
  },
  fourPiece: {
    description:
      "普通攻击、重击、元素战技或元素爆发命中后，攻击力提高 25%，持续 6 秒；若已完成魔女的课业，暴击率额外提高 20%。后台也能触发。",
    control: {
      key: "risingWindsState",
      label: "风起四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未命中 / 效果未生效" },
        { value: "active", label: "命中后效果生效" },
      ],
    },
    evaluateModifiers: ({
      witchHomeworkCompleted,
      selections,
    }) => {
      if (selections.risingWindsState === "inactive") return [];
      return [
        { kind: "stat", stat: "atkPct", value: 25 },
        ...(witchHomeworkCompleted
          ? ([
              { kind: "stat", stat: "critRate", value: 20 },
            ] as const)
          : []),
      ];
    },
  },
};
