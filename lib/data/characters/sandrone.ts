import type { CharacterPreset } from "./types.ts";
import {
  directStellarModel,
  stellarBaseBonusFromAtk,
  stellarConductControls,
} from "./stellar-common.ts";

const chargedBeam = [
  0.817, 0.8835, 0.95, 1.045, 1.1115, 1.1875, 1.292,
  1.3965, 1.501, 1.615, 1.729, 1.843, 1.957,
] as const;
const prismShot = [
  0.216, 0.2322, 0.2484, 0.27, 0.2862, 0.3024, 0.324,
  0.3456, 0.3672, 0.3888, 0.4104, 0.432, 0.459,
] as const;
const stellarRay = [
  2.2053, 2.3707, 2.5361, 2.7567, 2.9221, 3.0875, 3.308,
  3.5285, 3.7491, 3.9696, 4.1901, 4.4107, 4.6863,
] as const;

export const sandrone: CharacterPreset = {
  id: "sandrone",
  name: "桑多涅",
  level: 90,
  baseHp: 13226,
  baseAtk: 342,
  baseDef: 752,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "cryo",
  weaponType: "claymore",
  defaultWeaponId: "a-teaspoon-of-transcendence",
  burstEnergyCost: 60,
  stellarConduct: "enabler",
  panelEffects: [
    {
      id: "sandrone-a4-elemental-mastery",
      stage: "conversion",
      evaluate: ({ panel }) => [
        {
          stat: "elementalMastery",
          value: Math.min(160, (panel.atk / 100) * 8),
        },
      ],
    },
  ],
  teamBuffs: [
    {
      id: "sandrone-stellar-blessing",
      name: "星辉祝赐·超越之秘",
      description:
        "每 100 点攻击力使全队星电导基础伤害提高 0.7%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source, party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "damage",
                stat: "stellarBaseDamageBonus",
                value: stellarBaseBonusFromAtk(source.panel.atk),
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
    {
      id: "sandrone-c1-stellar",
      name: "C1·解码模式",
      description: "解码模式下，全队星反应伤害提高 30%。",
      minConstellation: 1,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "damage",
                stat: "stellarReactionDamageBonus",
                value: 30,
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
    {
      id: "sandrone-c6-elevation",
      name: "C6·星电导擢升",
      description: "桑多涅造成的星电导伤害获得 20% 擢升。",
      minConstellation: 6,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "damage",
                stat: "stellarElevation",
                value: 20,
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "解码模式",
      description: "解码模式下，全队星反应伤害提高 30%。",
    },
    {
      level: 2,
      name: "凝聚之钥",
      description: "凝聚光束的星电导暴击伤害逐次提高，最多 100%。",
    },
    {
      level: 3,
      name: "机械的礼法",
      description: "普通攻击等级提高 3 级。",
      talentLevelBonuses: { normal: 3 },
    },
    {
      level: 4,
      name: "越界之光",
      description: "追加一次 125% 攻击力的星电导伤害。",
    },
    {
      level: 5,
      name: "未竟的演算",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "超越之刻",
      description: "追加四次星电导伤害，并获得 20% 星电导擢升。",
    },
  ],
  damageProfile: {
    kind: "sandrone",
    talentLabel: "凝聚光束、棱晶射击与星辉射线",
    controls: [
      ...stellarConductControls,
      {
        key: "sandroneDecodingPower",
        label: "解码力",
        defaultValue: "above50",
        options: [
          { value: "below50", label: "不超过 50" },
          { value: "above50", label: "超过 50" },
        ],
      },
      {
        key: "sandroneTacticsStacks",
        label: "精密战术层数",
        defaultValue: "10",
        options: Array.from({ length: 11 }, (_, value) => ({
          value: String(value),
          label: `${value} 层`,
        })),
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      selection,
      settings,
      stellarConductActive,
      talentValue,
      percent,
    }) => {
      if (!stellarConductActive) return [];
      const charged = talentValue(
        chargedBeam,
        settings.normalTalentLevel,
      );
      const prism =
        talentValue(prismShot, settings.skillTalentLevel) *
        (selection("sandroneDecodingPower") === "above50" ? 4 : 1);
      const tactics = Math.min(
        10,
        Math.max(
          0,
          Number(selection("sandroneTacticsStacks")) || 0,
        ),
      );
      const ray =
        talentValue(stellarRay, settings.burstTalentLevel) *
        (1 + tactics * 0.1);
      const targets = [
        {
          id: "sandrone-condensed-beam",
          name: "凝聚光束",
          description: "重击凝聚光束直接造成的冰元素星电导伤害。",
          multiplierLabel: `${percent(charged)} 攻击力`,
          baseDamage: panel.atk * charged,
          category: "charged" as const,
          reactions: [],
          model: directStellarModel(),
          extraCritDmg: constellation >= 2 ? 100 : 0,
        },
        {
          id: "sandrone-prism-shot",
          name: "第二次棱晶射击",
          description:
            "解码力超过 50 时，第二次棱晶射击按四倍原始倍率结算。",
          multiplierLabel: `${percent(prism)} 攻击力`,
          baseDamage: panel.atk * prism,
          category: "skill" as const,
          reactions: [],
          model: directStellarModel(),
        },
        {
          id: "sandrone-stellar-ray",
          name: "星辉射线",
          description: `按 ${tactics} 层精密战术结算元素爆发星电导直伤。`,
          multiplierLabel: `${percent(ray)} 攻击力`,
          baseDamage: panel.atk * ray,
          category: "burst" as const,
          reactions: [],
          model: directStellarModel(),
        },
      ];
      if (constellation >= 4) {
        targets.push({
          id: "sandrone-c4-stellar",
          name: "C4·越界之光",
          description: "命座追加的冰元素星电导直伤。",
          multiplierLabel: "125% 攻击力",
          baseDamage: panel.atk * 1.25,
          category: "skill",
          reactions: [],
          model: directStellarModel(),
        });
      }
      if (constellation >= 6) {
        targets.push({
          id: "sandrone-c6-stellar",
          name: "C6·四次追加",
          description: "四次 80% 攻击力的冰元素星电导直伤合计。",
          multiplierLabel: "4 × 80% 攻击力",
          baseDamage: panel.atk * 0.8 * 4,
          category: "skill",
          reactions: [],
          model: directStellarModel(),
        });
      }
      return targets;
    },
  },
};
