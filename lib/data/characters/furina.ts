import type { CharacterPreset } from "./types.ts";

const salonMembers = [
  {
    id: "usher",
    name: "乌瑟勋爵",
    multipliers: [
      0.0596, 0.0641, 0.0685, 0.0745, 0.079, 0.0834, 0.0894,
      0.0954, 0.1013, 0.1073, 0.1132, 0.1192, 0.1267,
    ],
  },
  {
    id: "surintendante",
    name: "海薇玛夫人",
    multipliers: [
      0.0323, 0.0347, 0.0372, 0.0404, 0.0428, 0.0452, 0.0485,
      0.0517, 0.0549, 0.0582, 0.0614, 0.0646, 0.0687,
    ],
  },
  {
    id: "chevalmarin",
    name: "谢贝蕾妲小姐",
    multipliers: [
      0.0829, 0.0891, 0.0953, 0.1036, 0.1098, 0.116, 0.1243,
      0.1326, 0.1409, 0.1492, 0.1575, 0.1658, 0.1761,
    ],
  },
] as const;

const fanfareDamagePerPoint = [
  0.07, 0.09, 0.11, 0.13, 0.15, 0.17, 0.19, 0.21, 0.23,
  0.25, 0.27, 0.29, 0.31,
] as const;

function talentValue(values: readonly number[], talentLevel: number) {
  const level = Number.isFinite(talentLevel)
    ? Math.round(talentLevel)
    : 1;
  return values[Math.min(values.length, Math.max(1, level)) - 1] ?? 0;
}

function selectedFanfare(
  selections: Readonly<Record<string, string>>,
  constellation: number,
) {
  const raw = Number(selections.furinaFanfare ?? "300");
  const value = Number.isFinite(raw) ? Math.round(raw) : 300;
  return Math.min(constellation >= 1 ? 400 : 300, Math.max(0, value));
}

export const furina: CharacterPreset = {
  id: "furina",
  name: "芙宁娜",
  level: 90,
  baseHp: 15307,
  baseAtk: 244,
  baseDef: 696,
  ascensionStat: "critRate",
  ascensionValue: 24.2,
  ascensionLabel: "暴击率 +24.2%",
  element: "hydro",
  weaponType: "sword",
  defaultWeaponId: "splendor-of-tranquil-waters",
  burstEnergyCost: 60,
  teamBuffs: [
    {
      id: "furina-fanfare-damage",
      name: "万众狂欢·气氛值",
      description:
        "按所选气氛值与元素爆发等级，提高队伍中所有角色造成的伤害；C0 上限 300，C1 后上限 400。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "damageBonus",
          value:
            selectedFanfare(
              source.settings.selections,
              source.constellation,
            ) *
            talentValue(
              fanfareDamagePerPoint,
              source.settings.burstTalentLevel,
            ),
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "「爱是难驯鸟，哀乞亦无用。」",
      description: "施放爆发获得 150 点气氛值，气氛值上限提高至 400。",
    },
    {
      level: 2,
      name: "「女人皆善变，仿若水中萍。」",
      description:
        "提高气氛值获取速度，超过上限的气氛值可提高芙宁娜生命值。",
    },
    {
      level: 3,
      name: "「秘密藏心间，无人知我名。」",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "「若非处幽冥，怎知生可贵！」",
      description: "沙龙成员命中或歌者治疗时为芙宁娜恢复能量。",
    },
    {
      level: 5,
      name: "「我已有觉察，他名即是…！」",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "「诸君听我颂，共举爱之杯！」",
      description: "施放元素战技后获得水元素附魔与生命倍率强化。",
    },
  ],
  damageProfile: {
    kind: "furina",
    talentLabel: "孤心沙龙",
    controls: [
      {
        key: "furinaFanfare",
        label: "万众狂欢气氛值",
        defaultValue: "300",
        options: [
          { value: "0", label: "0 点" },
          { value: "50", label: "50 点" },
          { value: "100", label: "100 点" },
          { value: "150", label: "150 点" },
          { value: "200", label: "200 点" },
          { value: "250", label: "250 点" },
          { value: "300", label: "300 点（C0 上限）" },
          { value: "400", label: "400 点（C1+ 上限）" },
        ],
      },
    ],
    evaluateTargets: ({
      panel,
      settings,
      talentValue: valueAtLevel,
      percent,
    }) => {
      const salonBonus = Math.min(
        28,
        (panel.hp / 1000) * 0.7,
      );
      return salonMembers.map((member) => {
        const multiplier = valueAtLevel(
          member.multipliers,
          settings.skillTalentLevel,
        );
        return {
          id: `furina-salon-${member.id}`,
          name: `沙龙成员·${member.name}`,
          description:
            "单次攻击，计入固有天赋「无人听的自白」提供的沙龙成员增伤。",
          multiplierLabel: `${percent(multiplier)} 生命值上限`,
          baseDamage: panel.hp * multiplier,
          category: "skill" as const,
          reactions: ["none", "vaporize"] as const,
          extraDamageBonus: salonBonus,
        };
      });
    },
  },
};
