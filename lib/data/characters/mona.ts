import type { CharacterPreset } from "./types.ts";

const bubbleDamage = [
  4.424, 4.7558, 5.0876, 5.53, 5.8618, 6.1936, 6.636,
  7.0784, 7.5208, 7.9632, 8.4056, 8.848, 9.401,
] as const;

export const mona: CharacterPreset = {
  id: "mona",
  name: "莫娜",
  level: 90,
  baseHp: 10409,
  baseAtk: 287,
  baseDef: 653,
  ascensionStat: "energyRecharge",
  ascensionValue: 32,
  ascensionLabel: "元素充能效率 +32%",
  element: "hydro",
  weaponType: "catalyst",
  defaultWeaponId: "the-widsith",
  burstEnergyCost: 60,
  hexerei: true,
  panelEffects: [
    {
      id: "mona-waterborne-destiny",
      stage: "conversion",
      evaluate: ({ panel }) => [
        {
          stat: "elementalDmg",
          value: panel.energyRecharge * 0.2,
        },
      ],
    },
  ],
  teamBuffs: [
    {
      id: "mona-omen",
      name: "星异·伤害加成",
      description: "星异状态下，敌人受到的伤害提高 60%（按 10 级爆发）。",
      appliesToSelf: true,
      evaluate: () => [
        { kind: "damage", stat: "damageBonus", value: 60 },
      ],
    },
    {
      id: "mona-secret-vaporize",
      name: "魔导·秘仪·水星天的辉光",
      description:
        "消耗 3 层水星天的辉光，使队伍中其他角色本次蒸发伤害提高 15%。",
      appliesToSelf: false,
      evaluate: ({ party }) =>
        party.hexereiSecretRite
          ? [
              {
                kind: "damage",
                stat: "amplifyingReactionBonus",
                value: 15,
                reactions: ["vaporize"],
              },
            ]
          : [],
    },
  ],
  damageProfile: {
    kind: "mona",
    talentLabel: "星命定轨",
    controls: [],
    evaluateTargets: ({ panel, settings, talentValue }) => {
      const multiplier = talentValue(
        bubbleDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "mona-illusory-bubble",
          name: "泡影破裂",
          description: "元素爆发泡影破裂造成的水元素伤害。",
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "burst",
          reactions: ["none", "vaporize"],
        },
      ];
    },
  },
};
