import type { ArtifactSetPreset } from "./types.ts";

export const tenacityOfTheMillelith: ArtifactSetPreset = {
  id: "tenacity-of-the-millelith",
  name: "千岩牢固",
  shortName: "千岩",
  twoPiece: {
    description: "生命值提高 20%。",
    modifiers: [{ kind: "stat", stat: "hpPct", value: 20 }],
  },
  fourPiece: {
    description:
      "元素战技命中后，队伍中附近角色攻击力提高 20%、护盾强效提高 30%，持续 3 秒；后台也能触发。",
    control: {
      key: "tenacityState",
      label: "千岩四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "元素战技未命中" },
        { value: "active", label: "元素战技命中后" },
      ],
    },
    evaluateModifiers: ({ selections }) =>
      selections.tenacityState === "inactive"
        ? []
        : [{ kind: "stat", stat: "atkPct", value: 20 }],
    panelNote: "当前只计算 20% 攻击力；护盾强效不进入伤害面板。",
  },
  teamBuffs: [
    {
      id: "tenacity-team-attack",
      name: "千岩牢固四件套",
      description: "元素战技命中后，全队攻击力提高 20%。",
      stackingGroup: "tenacity-team-attack",
      minArtifactPieces: 4,
      evaluate: ({ source }) =>
        source.artifactSelections.tenacityState === "inactive"
          ? []
          : [{ kind: "panel", stat: "atkPct", value: 20 }],
    },
  ],
};
