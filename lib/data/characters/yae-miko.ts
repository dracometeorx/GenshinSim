import type { CharacterPreset } from "./types.ts";
import {
  directStellarModel,
  stellarConductControls,
} from "./stellar-common.ts";

export const yaeMiko: CharacterPreset = {
  id: "yae-miko",
  name: "八重神子",
  level: 90,
  baseHp: 10372,
  baseAtk: 340,
  baseDef: 569,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "electro",
  weaponType: "catalyst",
  defaultWeaponId: "the-widsith",
  burstEnergyCost: 90,
  stellarConduct: "related",
  teamBuffs: [
    {
      id: "yae-c1-stellar",
      name: "C1·神樱垂迹",
      description: "触发星电导后，全队雷元素与星反应伤害提高 50%。",
      minConstellation: 1,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                value: 50,
                element: "electro",
              },
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
      id: "yae-c2-mastery",
      name: "C2·杀生樱共鸣",
      description: "三阶杀生樱使八重神子与当前场上角色元素精通提高 200 点。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [{ kind: "panel", stat: "elementalMastery", value: 200 }]
          : [],
    },
  ],
  constellations: [
    { level: 1, name: "野狐供真篇", description: "提高雷元素与星反应伤害。" },
    { level: 2, name: "望月吼哕声", description: "三阶杀生樱共享 200 点元素精通。" },
    {
      level: 3,
      name: "七段妙变化",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 4, name: "绯樱引雷章", description: "进一步强化雷元素伤害。" },
    {
      level: 5,
      name: "暴恶嗤笑面",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "大杀生咒禁",
      description: "杀生樱无视防御，八重神子星电导暴击伤害提高 200%。",
    },
  ],
  damageProfile: {
    kind: "yae-miko",
    talentLabel: "杀生樱星电导追击",
    controls: stellarConductControls,
    evaluateTargets: ({
      constellation,
      panel,
      stellarConductActive,
    }) => {
      if (!stellarConductActive) return [];
      return [
        {
          id: "yae-stellar-followup",
          name: "杀生樱·星电导追击",
          description: "触发星电导后，下一次杀生樱攻击追加的雷元素星电导直伤。",
          multiplierLabel: "200% 攻击力",
          baseDamage: panel.atk * 2,
          category: "skill",
          reactions: [],
          model: directStellarModel(),
          extraCritDmg: constellation >= 6 ? 200 : 0,
        },
        {
          id: "yae-stellar-skill-cast",
          name: "三株杀生樱·追加",
          description: "场上存在三株杀生樱时，施放元素战技追加的星电导直伤。",
          multiplierLabel: "50% 攻击力",
          baseDamage: panel.atk * 0.5,
          category: "skill",
          reactions: [],
          model: directStellarModel(),
          extraCritDmg: constellation >= 6 ? 200 : 0,
        },
      ];
    },
  },
};
