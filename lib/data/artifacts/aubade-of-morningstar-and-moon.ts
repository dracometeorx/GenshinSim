import type { ArtifactSetPreset } from "./types.ts";

export const aubadeOfMorningstarAndMoon: ArtifactSetPreset = {
  id: "aubade-of-morningstar-and-moon",
  name: "晨星与月的晓歌",
  shortName: "晨星",
  twoPiece: {
    description: "元素精通提高 80 点。",
    modifiers: [
      { kind: "stat", stat: "elementalMastery", value: 80 },
    ],
  },
  fourPiece: {
    description:
      "处于队伍后台时，月曜反应伤害提高 20%；月兆·满辉时额外提高 40%。切至前台 3 秒后失效。",
    evaluateModifiers: ({ moonsignLevel, selections }) => {
      if (selections.aubadeState === "inactive") return [];
      const value = moonsignLevel === "ascendant" ? 60 : 20;
      return [{ kind: "lunarDamageBonus", value }];
    },
    control: {
      key: "aubadeState",
      label: "晨星四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "前台超过 3 秒 / 未生效" },
        { value: "active", label: "后台效果生效" },
      ],
    },
    panelNote:
      "当前仅按开关计算后台增益；不会模拟切人后的三秒持续时间。",
  },
};
