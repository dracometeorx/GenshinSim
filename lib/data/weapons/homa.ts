import type { WeaponPreset } from "./types.ts";
import { hpStateOptions } from "../common.ts";

const hpBonus = [20, 25, 30, 35, 40] as const;
const baseRatio = [0.8, 1, 1.2, 1.4, 1.6] as const;
const activeRatio = [1, 1.2, 1.4, 1.6, 1.8] as const;

export const homa: WeaponPreset = {
  id: "homa",
  name: "护摩之杖",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "critDmg",
  secondaryValue: 66.2,
  secondaryLabel: "暴击伤害 +66.2%",
  passive: {
    name: "无羁的朱赤之蝶",
    description: "生命值提高 20%；攻击力提高生命值上限的 0.8%，生命低于 50% 时再提高 1%。",
    panelEffects: [
      {
        id: "homa-hp",
        stage: "additive",
        evaluate: ({ refinementIndex }) => [
          { stat: "hpPct", value: hpBonus[refinementIndex] },
        ],
      },
      {
        id: "homa-hp-to-attack",
        stage: "conversion",
        evaluate: ({ panel, refinementIndex }) => [
          {
            stat: "flatAtk",
            value:
              panel.hp * (baseRatio[refinementIndex] / 100),
          },
        ],
      },
      {
        id: "homa-low-hp-to-attack",
        stage: "conversion",
        conditional: true,
        evaluate: ({
          panel,
          refinementIndex,
          weaponSelections,
        }) =>
          weaponSelections.homaHpState === "below50"
            ? [
                {
                  stat: "flatAtk",
                  value:
                    panel.hp *
                    (activeRatio[refinementIndex] / 100),
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: [
      "生命值提高 20%；攻击力提高生命值上限的 0.8%，生命低于 50% 时再提高 1%。",
      "生命值提高 25%；攻击力提高生命值上限的 1%，生命低于 50% 时再提高 1.2%。",
      "生命值提高 30%；攻击力提高生命值上限的 1.2%，生命低于 50% 时再提高 1.4%。",
      "生命值提高 35%；攻击力提高生命值上限的 1.4%，生命低于 50% 时再提高 1.6%。",
      "生命值提高 40%；攻击力提高生命值上限的 1.6%，生命低于 50% 时再提高 1.8%。",
    ],
    control: {
      key: "homaHpState",
      label: "当前生命值",
      defaultValue: "above50",
      options: hpStateOptions,
    },
  },
};
