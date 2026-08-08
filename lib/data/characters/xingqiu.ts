import type { CharacterPreset } from "./types.ts";

const rainSwordDamage = [
  0.543, 0.583, 0.624, 0.678, 0.719, 0.76, 0.814,
  0.868, 0.923, 0.977, 1.031, 1.085, 1.153,
] as const;

export const xingqiu: CharacterPreset = {
  id: "xingqiu",
  name: "行秋",
  level: 90,
  baseHp: 10222,
  baseAtk: 202,
  baseDef: 758,
  ascensionStat: "atkPct",
  ascensionValue: 24,
  ascensionLabel: "攻击力 +24%",
  element: "hydro",
  weaponType: "sword",
  defaultWeaponId: "favonius-sword",
  burstEnergyCost: 80,
  panelEffects: [
    {
      id: "xingqiu-blades-amidst-raindrops",
      stage: "additive",
      evaluate: () => [{ stat: "elementalDmg", value: 20 }],
    },
  ],
  teamBuffs: [
    {
      id: "xingqiu-c2-hydro-resistance",
      name: "C2·天青现虹",
      description:
        "受到剑雨攻击的敌人水元素抗性降低 15%，持续 4 秒。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          element: "hydro",
          value: 15,
        },
      ],
    },
  ],
  constellations: [
    { level: 1, name: "重帘留香", description: "雨帘剑数量增加 1 柄。" },
    {
      level: 2,
      name: "天青现虹",
      description: "延长爆发持续时间，并降低敌人水元素抗性。",
    },
    {
      level: 3,
      name: "织诗成锦",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "孤舟斩蛟",
      description: "爆发持续期间元素战技伤害提高 50%。",
      damageEffects: [
        {
          id: "xingqiu-c4-skill-damage",
          evaluate: ({ target }) =>
            target.category === "skill"
              ? [{ stat: "baseDamageMultiplier", value: 50 }]
              : [],
        },
      ],
    },
    {
      level: 5,
      name: "雨深闭门",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 6, name: "万文集此", description: "强化剑雨攻击并恢复元素能量。" },
  ],
  damageProfile: {
    kind: "xingqiu",
    talentLabel: "古华剑·裁雨留虹",
    controls: [],
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const multiplier = talentValue(
        rainSwordDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "xingqiu-rain-sword",
          name: "剑雨单剑",
          description: "元素爆发协同攻击中单柄雨剑造成的水元素伤害。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "burst",
          reactions: ["none", "vaporize"],
        },
      ];
    },
  },
};
