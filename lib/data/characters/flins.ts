import type { CharacterPreset } from "./types.ts";
import {
  directLunarModel,
  lunarBaseBonusFromAtk,
  talentCurve,
} from "./lunar-common.ts";

const thunderousSymphony = talentCurve(0.715);
const thunderousExtra = talentCurve(1.039);

export const flins: CharacterPreset = {
  id: "flins",
  name: "菲林斯",
  level: 90,
  baseHp: 12491,
  baseAtk: 352,
  baseDef: 809,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "electro",
  weaponType: "polearm",
  defaultWeaponId: "bloodsoaked-ruins",
  burstEnergyCost: 80,
  moonsign: true,
  teamBuffs: [
    {
      id: "flins-whispering-flame",
      name: "幽焰的呢喃",
      description:
        "菲林斯元素精通提高攻击力的 8%；C4 后为 10%，并提高上限。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ source }) => {
        const rate = source.constellation >= 4 ? 0.1 : 0.08;
        const cap = source.constellation >= 4 ? 220 : 160;
        return [
          {
            kind: "panel",
            stat: "elementalMastery",
            value: Math.min(cap, source.panel.atk * rate),
          },
        ];
      },
    },
    {
      id: "flins-lunar-blessing",
      name: "月兆祝赐·旧世潜藏",
      description:
        "每 100 点攻击力使月感电基础伤害提高 0.7%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarBaseDamageBonus",
          value: lunarBaseBonusFromAtk(source.panel.atk),
          lunarReactions: ["lunarCharged"],
        },
      ],
    },
    {
      id: "flins-full-moon",
      name: "寒冬的交响",
      description: "月兆·满辉时，菲林斯的月感电伤害提高 20%。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "lunarReactionDamageBonus",
                value: 20,
                lunarReactions: ["lunarCharged"],
              },
            ]
          : [],
    },
    {
      id: "flins-c2-electro-resistance",
      name: "C2·渡越魍魉之墙",
      description:
        "月兆·满辉时，菲林斯命中后使敌人雷元素抗性降低 25%。",
      minConstellation: 2,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                value: 25,
                element: "electro",
              },
            ]
          : [],
    },
    {
      id: "flins-c6-elevation",
      name: "C6·歌与亡者之舞",
      description:
        "菲林斯月感电擢升 35%；满辉时队伍月感电额外擢升 10%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ target, party }) => {
        const value =
          target.characterId === "flins"
            ? 35 +
              (party.moonsignLevel === "ascendant" ? 10 : 0)
            : party.moonsignLevel === "ascendant"
              ? 10
              : 0;
        return value
          ? [
              {
                kind: "damage",
                stat: "lunarElevation",
                value,
                lunarReactions: ["lunarCharged"],
              },
            ]
          : [];
      },
    },
  ],
  constellations: [
    {
      level: 2,
      name: "渡越魍魉之墙",
      description: "追加直伤月感电；满辉时降低敌人雷抗。",
    },
    {
      level: 3,
      name: "夜访陌客之沼",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "荒山嘶啭之夜",
      description: "攻击力提高 20%，并强化攻击转精通。",
      panelEffects: [
        {
          id: "flins-c4-atk",
          stage: "additive",
          evaluate: () => [{ stat: "atkPct", value: 20 }],
        },
      ],
    },
    {
      level: 5,
      name: "逐远避世之影",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "歌与亡者之舞",
      description: "提高自身及满辉队伍的月感电擢升。",
    },
  ],
  damageProfile: {
    kind: "flins",
    talentLabel: "元素爆发等级",
    controls: [],
    evaluateTargets: ({
      constellation,
      moonsignLevel,
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const multiplier = talentValue(
        thunderousSymphony,
        settings.burstTalentLevel,
      );
      const extraMultiplier =
        moonsignLevel === "ascendant"
          ? talentValue(
              thunderousExtra,
              settings.burstTalentLevel,
            )
          : 0;
      const targets = [
        {
          id: "flins-thunderous-symphony",
          name:
            extraMultiplier > 0
              ? "雷霆交响·两段合计"
              : "雷霆交响",
          description:
            extraMultiplier > 0
              ? "特殊元素爆发本体与雷暴云存在时的追加直伤之和；不计算雷暴云本体伤害。"
              : "特殊元素爆发的直接月感电伤害；满辉且雷暴云存在时会补充追加段。",
          multiplierLabel:
            extraMultiplier > 0
              ? `${percent(multiplier)} + ${percent(extraMultiplier)} 攻击力`
              : `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * (multiplier + extraMultiplier),
          category: "burst" as const,
          reactions: [],
          model: directLunarModel("lunarCharged"),
          segments:
            extraMultiplier > 0
              ? [
                  {
                    id: "flins-thunderous-symphony-main",
                    name: "雷霆交响本体",
                    multiplierLabel: `${percent(multiplier)} 攻击力`,
                    baseDamage: panel.atk * multiplier,
                  },
                  {
                    id: "flins-thunderous-symphony-extra",
                    name: "满辉追加直伤",
                    multiplierLabel: `${percent(extraMultiplier)} 攻击力`,
                    baseDamage: panel.atk * extraMultiplier,
                  },
                ]
              : undefined,
        },
      ];
      if (constellation >= 2) {
        targets.push({
          id: "flins-c2-wall",
          name: "渡越魍魉之墙",
          description: "C2 施放枪阵后的下一次普攻追加直伤月感电。",
          multiplierLabel: "50% 攻击力",
          baseDamage: panel.atk * 0.5,
          category: "normal",
          reactions: [],
          model: directLunarModel("lunarCharged"),
        });
      }
      return targets;
    },
  },
};
