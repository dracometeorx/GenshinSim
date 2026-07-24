import type { CharacterPreset } from "./types.ts";
import {
  directStellarModel,
  stellarConductControls,
} from "./stellar-common.ts";

const burstStellar = [
  2.9733, 3.1963, 3.4193, 3.7167, 3.9397, 4.1627, 4.46,
  4.7573, 5.0547, 5.352, 5.6493, 5.9467, 6.3183,
] as const;

export const qiqi: CharacterPreset = {
  id: "qiqi",
  name: "七七",
  level: 90,
  baseHp: 12368,
  baseAtk: 287,
  baseDef: 922,
  ascensionStat: "none",
  ascensionValue: 0,
  ascensionLabel: "治疗加成 +22.2%",
  element: "cryo",
  weaponType: "sword",
  defaultWeaponId: "favonius-sword",
  burstEnergyCost: 80,
  stellarConduct: "related",
  panelEffects: [
    {
      id: "qiqi-ascension-healing-bonus",
      stage: "additive",
      evaluate: () => [
        { stat: "healingBonus", value: 22.2 },
      ],
    },
  ],
  teamBuffs: [
    {
      id: "qiqi-seven-sacred-treasures",
      name: "七圣宝鉴",
      description: "仙法·寒病鬼差持续期间，全队星电导伤害提高 50%。",
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "damage",
                stat: "stellarReactionDamageBonus",
                value: 50,
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
    {
      id: "qiqi-c2-radiance-atk",
      name: "C2·皎辉攻击力",
      description: "皎辉状态下，七七攻击力提高 50%。",
      minConstellation: 2,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [{ kind: "panel", stat: "atkPct", value: 50 }]
          : [],
    },
    {
      id: "qiqi-c6-stellar-additive",
      name: "C6·度厄真符",
      description:
        "施放爆发后，其他前台角色的星电导直伤追加七七 600% 攻击力。",
      minConstellation: 6,
      appliesToSelf: false,
      evaluate: ({ source, target, party }) =>
        party.stellarConductActive &&
        target.characterId !== "qiqi"
          ? [
              {
                kind: "damage",
                stat: "stellarAdditiveBaseDamage",
                value: source.panel.atk * 6,
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    { level: 1, name: "寒苦回向", description: "强化元素能量回复。" },
    { level: 2, name: "冰寒蚀骨", description: "皎辉状态下攻击力提高 50%。" },
    {
      level: 3,
      name: "升天宝诰",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 4, name: "天威压众", description: "强化治疗与生存能力。" },
    {
      level: 5,
      name: "红莲开绽",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "起死回骸",
      description: "为其他前台角色追加基于七七攻击力的星电导直伤。",
    },
  ],
  damageProfile: {
    kind: "qiqi",
    talentLabel: "救苦度厄",
    controls: stellarConductControls,
    evaluateTargets: ({
      panel,
      settings,
      stellarConductActive,
      talentValue,
      percent,
    }) => {
      if (!stellarConductActive) return [];
      const multiplier = talentValue(
        burstStellar,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "qiqi-burst-stellar",
          name: "救苦度厄·星电导",
          description: "元素爆发直接造成的冰元素星电导伤害。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "burst",
          reactions: [],
          model: directStellarModel(),
        },
      ];
    },
  },
};
