import type { ArtifactSetPreset } from "./types.ts";

export const delusionOfImmolatedShadow: ArtifactSetPreset = {
  id: "delusion-of-immolated-shadow",
  name: "影中沉凝的幻灭",
  shortName: "幻灭",
  twoPiece: {
    description: "攻击力提高 18%。",
    modifiers: [{ kind: "stat", stat: "atkPct", value: 18 }],
  },
  fourPiece: {
    description:
      "星电导伤害提高 40%；攻击处于超导或星电导状态下的敌人时，暴击率提高 16%。",
    control: {
      key: "delusionStellarState",
      label: "幻灭四件套",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "目标未处于对应状态" },
        {
          value: "active",
          label: "目标处于超导或星电导状态",
          modifiers: [
            { kind: "stat", stat: "critRate", value: 16 },
            {
              kind: "stellarDamageBonus",
              value: 40,
              stellarReactions: ["stellarConduct"],
            },
          ],
        },
      ],
    },
    panelNote:
      "本计算器不计算超导剧变伤害；四件套的星电导增伤仅进入星电导直伤乘区。",
  },
};
