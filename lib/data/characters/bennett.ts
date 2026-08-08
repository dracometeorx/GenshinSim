import type { CharacterPreset } from "./types.ts";

const fantasticVoyageDamage = [
  2.33, 2.5, 2.68, 2.91, 3.08, 3.26, 3.49, 3.72, 3.96,
  4.19, 4.42, 4.66, 4.95,
] as const;
const fantasticVoyageAttackBonus = [
  56, 60, 64, 70, 74, 78, 84, 90, 95, 101, 106, 112, 119,
] as const;

function talentTableValue(
  values: readonly number[],
  talentLevel: number,
) {
  const level = Number.isFinite(talentLevel)
    ? Math.round(talentLevel)
    : 1;
  return values[
    Math.min(values.length - 1, Math.max(0, level - 1))
  ] ?? values[0] ?? 0;
}

export const bennett: CharacterPreset = {
  id: "bennett",
  name: "班尼特",
  level: 90,
  baseHp: 12397,
  baseAtk: 191,
  baseDef: 771,
  ascensionStat: "energyRecharge",
  ascensionValue: 26.7,
  ascensionLabel: "元素充能效率 +26.7%",
  element: "pyro",
  weaponType: "sword",
  defaultWeaponId: "skyward-blade",
  burstEnergyCost: 60,
  teamBuffs: [
    {
      id: "bennett-fantastic-voyage-attack",
      name: "美妙旅程·鼓舞领域",
      description:
        "按班尼特基础攻击力与爆发等级提高当前场上角色攻击力；C1 额外追加基础攻击力的 20%。",
      appliesToSelf: false,
      evaluate: ({ source }) => {
        const ratio =
          talentTableValue(
            fantasticVoyageAttackBonus,
            source.settings.burstTalentLevel,
          ) + (source.constellation >= 1 ? 20 : 0);
        return [
          {
            kind: "panel",
            stat: "flatAtk",
            value: source.baseAtk * (ratio / 100),
            stage: "postConversion",
          },
        ];
      },
    },
    {
      id: "bennett-c6-pyro-damage",
      name: "C6·烈火与勇气",
      description:
        "美妙旅程领域内，当前场上角色造成的火元素伤害提高 15%；不模拟附魔覆盖关系。",
      minConstellation: 6,
      appliesToSelf: false,
      evaluate: ({ target }) =>
        ["sword", "claymore", "polearm"].includes(
          target.weaponType,
        )
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                element: "pyro",
                value: 15,
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "冒险憧憬",
      description:
        "鼓舞领域的攻击力提升不再有生命值限制，并追加班尼特基础攻击力的 20%。",
    },
    {
      level: 2,
      name: "踏破绝境",
      description: "生命值低于 70% 时元素充能效率提高 30%。",
    },
    {
      level: 3,
      name: "火热激情",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "热情不灭",
      description: "一段蓄力战技可追加相当于第二段攻击 135% 的追击。",
    },
    {
      level: 5,
      name: "开拓的心魂",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "烈火与勇气",
      description:
        "鼓舞领域内提供 15% 火元素伤害加成，并为部分近战武器提供火元素附魔。",
    },
  ],
  damageProfile: {
    kind: "bennett",
    talentLabel: "美妙旅程",
    controls: [],
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const multiplier = talentValue(
        fantasticVoyageDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "bennett-fantastic-voyage",
          name: "美妙旅程·腾跃轰击",
          description:
            "元素爆发施放时的火元素伤害；不计入本次施放后才生效的鼓舞领域加攻。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        },
      ];
    },
  },
};
