import type { CharacterPreset } from "./types.ts";

const skillDamage = [
  2.112, 2.2704, 2.4288, 2.64, 2.7984, 2.9568, 3.168,
  3.3792, 3.5904, 3.8016, 4.0128, 4.224, 4.488,
] as const;

export const sucrose: CharacterPreset = {
  id: "sucrose",
  name: "砂糖",
  level: 90,
  baseHp: 9243,
  baseAtk: 170,
  baseDef: 703,
  ascensionStat: "elementalDmg",
  ascensionValue: 24,
  ascensionLabel: "风元素伤害加成 +24%",
  element: "anemo",
  weaponType: "catalyst",
  defaultWeaponId: "sacrificial-fragments",
  burstEnergyCost: 80,
  hexerei: true,
  teamBuffs: [
    {
      id: "sucrose-mastery-share",
      name: "触媒置换术·小小的慧风",
      description:
        "触发扩散并命中后，队友获得 50 点加砂糖元素精通 20% 的元素精通。",
      appliesToSelf: false,
      evaluate: ({ source }) => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: 50 + source.panel.elementalMastery * 0.2,
        },
      ],
    },
    {
      id: "sucrose-secret-small-spirit",
      name: "魔导·秘仪·小型风灵",
      description:
        "召唤小型风灵后，全队普通攻击、重击、下落攻击、元素战技与元素爆发伤害提高 5.71428%。",
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.hexereiSecretRite
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                value: 5.71428,
              },
            ]
          : [],
    },
    {
      id: "sucrose-secret-large-spirit",
      name: "魔导·秘仪·大型风灵",
      description:
        "召唤大型风灵后，队伍中的魔导角色对应伤害提高 7.14285%。",
      appliesToSelf: true,
      evaluate: ({ target, party }) =>
        party.hexereiSecretRite && target.hexerei
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                value: 7.14285,
              },
            ]
          : [],
    },
    {
      id: "sucrose-c6-chaotic-entropy",
      name: "C6·混元熵增论",
      description:
        "大型风灵发生元素转化后，全队获得 20% 对应元素伤害加成；魔导·秘仪开启时，魔导角色额外获得 8.57142%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ source, target, party }) => {
        const absorbedElement =
          source.settings.selections.sucroseBurstAbsorption;
        if (
          !absorbedElement ||
          absorbedElement === "none" ||
          target.element !== absorbedElement
        ) {
          return [];
        }
        return [
          {
            kind: "panel",
            stat: "elementalDmg",
            value:
              20 +
              (party.hexereiSecretRite && target.hexerei
                ? 8.57142
                : 0),
          },
        ];
      },
    },
  ],
  constellations: [
    {
      level: 1,
      name: "堆叠真空域",
      description: "元素战技的可使用次数增加 1 次。",
    },
    {
      level: 2,
      name: "不羁型贝特",
      description: "元素爆发的技能持续时间延长 2 秒。",
    },
    {
      level: 3,
      name: "零失误少女",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "炼金的偏执",
      description:
        "普通攻击或重击累计命中 7 次后，元素战技冷却时间随机减少 1–7 秒。",
    },
    {
      level: 5,
      name: "认真普通瓶",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "混元熵增论",
      description:
        "元素爆发发生元素转化后提供对应元素增伤，并强化魔导角色获得的增伤。",
    },
  ],
  damageProfile: {
    kind: "sucrose",
    talentLabel: "风灵作成·陆叁零捌",
    controls: [
      {
        key: "sucroseBurstAbsorption",
        label: "C6 大型风灵元素转化",
        defaultValue: "none",
        options: [
          { value: "none", label: "未发生元素转化" },
          { value: "pyro", label: "火元素转化" },
          { value: "hydro", label: "水元素转化" },
          { value: "electro", label: "雷元素转化" },
          { value: "cryo", label: "冰元素转化" },
        ],
      },
    ],
    evaluateTargets: ({ panel, settings, talentValue }) => {
      const multiplier = talentValue(
        skillDamage,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "sucrose-skill",
          name: "小型风灵",
          description: "元素战技造成的风元素范围伤害。",
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
        },
      ];
    },
  },
};
