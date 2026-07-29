import type { CharacterPreset } from "./types.ts";
import {
  stellarConductControls,
  talentCurve,
} from "./stellar-common.ts";

const fullCounter = talentCurve(2.88);

export const beidou: CharacterPreset = {
  id: "beidou",
  name: "北斗",
  level: 90,
  baseHp: 13050,
  baseAtk: 225,
  baseDef: 648,
  ascensionStat: "elementalDmg",
  ascensionValue: 24,
  ascensionLabel: "雷元素伤害加成 +24%",
  element: "electro",
  weaponType: "claymore",
  defaultWeaponId: "wolfs-gravestone",
  burstEnergyCost: 80,
  stellarConduct: "related",
  teamBuffs: [
    {
      id: "beidou-c6-stellar-support",
      name: "C6·星极破浪",
      description:
        "星极场中雷兽之盾持续时，前台角色元素精通提高 200，并使附近敌人冰、雷抗性降低 15%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: 200,
              },
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                value: 15,
                element: "electro",
              },
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                value: 15,
                element: "cryo",
              },
            ]
          : [],
    },
  ],
  constellations: [
    { level: 1, name: "鱼龙沉四方", description: "施放元素爆发后生成护盾。" },
    { level: 2, name: "赫赫雷涌起", description: "强化闪雷弹跳。" },
    {
      level: 3,
      name: "潮奔蓦引电",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 4, name: "牵星觅乡岸", description: "强化普通攻击附伤。" },
    {
      level: 5,
      name: "踏浪霞连阶",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 6, name: "北斗祓幽孽", description: "星极场中提供精通与冰、雷抗性削减。" },
  ],
  damageProfile: {
    kind: "beidou",
    talentLabel: "捉浪",
    controls: stellarConductControls,
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const multiplier = talentValue(
        fullCounter,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "beidou-full-counter",
          name: "捉浪·最高伤害",
          description:
            "北斗本身不直接造成星电导伤害；此项显示完全反击的普通雷元素伤害。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
        },
      ];
    },
  },
};
