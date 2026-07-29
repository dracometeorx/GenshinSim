import type { CharacterPreset } from "./types.ts";
import {
  directStellarModel,
  stellarConductControls,
} from "./stellar-common.ts";

const normalThird = [
  0.6722, 0.7269, 0.7817, 0.8598, 0.9145, 0.9771, 1.0631,
  1.149, 1.235, 1.3288, 1.4226, 1.5164, 1.6102,
] as const;
const normalFifth = [
  0.9074, 0.9813, 1.0551, 1.1607, 1.2345, 1.3189, 1.435,
  1.5511, 1.6671, 1.7937, 1.9204, 2.047, 2.1736,
] as const;
const charged = [
  1.5296, 1.6443, 1.759, 1.912, 2.0267, 2.1414, 2.2944,
  2.4474, 2.6003, 2.7533, 2.9062, 3.0592, 3.2504,
] as const;
const skillEnhancement = [
  1.4317, 1.4575, 1.4834, 1.517, 1.5429, 1.5687, 1.6023,
  1.6359, 1.6695, 1.7031, 1.7367, 1.7703, 1.8039,
] as const;

export const wriothesley: CharacterPreset = {
  id: "wriothesley",
  name: "莱欧斯利",
  level: 90,
  baseHp: 13593,
  baseAtk: 311,
  baseDef: 763,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "cryo",
  weaponType: "catalyst",
  defaultWeaponId: "lost-prayer",
  burstEnergyCost: 60,
  stellarConduct: "related",
  teamBuffs: [
    {
      id: "wriothesley-stellar-radiance",
      name: "皎辉·星霜拳",
      description: "皎辉状态下，莱欧斯利造成的星电导伤害提高 30%。",
      appliesToSelf: true,
      appliesToTeammates: false,
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
  ],
  constellations: [
    { level: 1, name: "予行恶者以惩惧", description: "强化第五段普攻与惩戒重击的星电导基础伤害。" },
    { level: 2, name: "予骄暴者以镣锁", description: "提高星霜拳的星电导转化倍率。" },
    {
      level: 3,
      name: "予婪诈者以谴罚",
      description: "普通攻击等级提高 3 级。",
      talentLevelBonuses: { normal: 3 },
    },
    { level: 4, name: "予苦痛者以拯赎", description: "强化治疗与攻击速度。" },
    {
      level: 5,
      name: "予冤诉者以怜恕",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 6, name: "予无罪者以念抚", description: "提高暴击并追加星电导冰锥伤害。" },
  ],
  damageProfile: {
    kind: "wriothesley",
    talentLabel: "冰牙突驰与烈霜惩戒",
    controls: stellarConductControls,
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      stellarConductActive,
      talentValue,
      percent,
    }) => {
      if (!stellarConductActive) return [];
      const skill = talentValue(
        skillEnhancement,
        settings.skillTalentLevel,
      );
      const ratios =
        constellation >= 2
          ? { third: 0.9, fifth: 1.2, charged: 1.5 }
          : { third: 0.6, fifth: 0.8, charged: 1 };
      const c1Multiplier = constellation >= 1 ? 1.5 : 1;
      const third =
        talentValue(normalThird, settings.normalTalentLevel) *
        skill *
        ratios.third;
      const fifth =
        talentValue(normalFifth, settings.normalTalentLevel) *
        skill *
        ratios.fifth *
        c1Multiplier;
      const chargedMultiplier =
        talentValue(charged, settings.normalTalentLevel) *
        ratios.charged *
        c1Multiplier;
      const critRate = constellation >= 6 ? 10 : 0;
      const critDmg = constellation >= 6 ? 80 : 0;
      const targets = [
        {
          id: "wriothesley-third-stellar",
          name: "第三段强化普攻·星电导",
          description: "冰牙突驰强化后的第三段普攻转化为冰元素星电导直伤。",
          multiplierLabel: `${percent(third)} 攻击力`,
          baseDamage: panel.atk * third,
          category: "normal" as const,
          reactions: [],
          model: directStellarModel(),
          extraCritRate: critRate,
          extraCritDmg: critDmg,
        },
        {
          id: "wriothesley-fifth-stellar",
          name: "第五段强化普攻·星电导",
          description: "冰牙突驰强化后的第五段普攻转化为冰元素星电导直伤。",
          multiplierLabel: `${percent(fifth)} 攻击力`,
          baseDamage: panel.atk * fifth,
          category: "normal" as const,
          reactions: [],
          model: directStellarModel(),
          extraCritRate: critRate,
          extraCritDmg: critDmg,
        },
        {
          id: "wriothesley-charged-stellar",
          name: "烈霜惩戒·星电导",
          description: "强化重击直接造成的冰元素星电导伤害。",
          multiplierLabel: `${percent(chargedMultiplier)} 攻击力`,
          baseDamage: panel.atk * chargedMultiplier,
          category: "charged" as const,
          reactions: [],
          model: directStellarModel(),
          extraCritRate: critRate,
          extraCritDmg: critDmg,
        },
      ];
      if (constellation >= 6) {
        targets.push({
          id: "wriothesley-c6-stellar-icicle",
          name: "C6·星霜冰锥",
          description: "第五段普攻或烈霜惩戒追加的星电导冰锥直伤。",
          multiplierLabel: "20% 原始伤害",
          baseDamage: panel.atk * chargedMultiplier * 0.2,
          category: "charged",
          reactions: [],
          model: directStellarModel(),
          extraCritRate: critRate,
          extraCritDmg: critDmg,
        });
      }
      return targets;
    },
  },
};
