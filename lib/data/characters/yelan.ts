import type { CharacterPreset } from "./types.ts";

const exquisiteThrowDamage = [
  0.0487, 0.0524, 0.056, 0.0609, 0.0646, 0.0682, 0.0731,
  0.078, 0.0828, 0.0877, 0.0926, 0.0974, 0.1035,
] as const;

function selectedElementTypes(selections: Readonly<Record<string, string>>) {
  const value = Number(selections.yelanElementTypes ?? "4");
  return Math.min(4, Math.max(1, Math.round(value) || 4));
}

function selectedAdaptBonus(selections: Readonly<Record<string, string>>) {
  const value = Number(selections.yelanAdaptWithEaseBonus ?? "25");
  return Math.min(50, Math.max(0, Number.isFinite(value) ? value : 25));
}

export const yelan: CharacterPreset = {
  id: "yelan",
  name: "夜兰",
  level: 90,
  baseHp: 14450,
  baseAtk: 244,
  baseDef: 548,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "hydro",
  weaponType: "bow",
  defaultWeaponId: "favonius-warbow",
  burstEnergyCost: 70,
  panelEffects: [
    {
      id: "yelan-turn-control",
      stage: "additive",
      conditional: true,
      evaluate: ({ damageSelections }) => {
        const hpBonus = [0, 6, 12, 18, 30][
          selectedElementTypes(damageSelections)
        ];
        return [{ stat: "hpPct", value: hpBonus ?? 30 }];
      },
    },
  ],
  teamBuffs: [
    {
      id: "yelan-adapt-with-ease",
      name: "妙转随心",
      description:
        "玄掷玲珑存在期间，提高当前场上角色造成的伤害；按所选持续阶段计算，最高 50%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "damageBonus",
          value: selectedAdaptBonus(source.settings.selections),
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "与谋者，以局入局",
      description: "元素战技可使用次数增加 1 次。",
    },
    {
      level: 2,
      name: "入彀者，多多益善",
      description: "玄掷玲珑协同攻击时额外发射水箭。",
    },
    {
      level: 3,
      name: "晃盅者，琼畟药骰",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "诓惑者，接树移花",
      description: "萦络纵命索按标记数量提高队伍生命值上限。",
    },
    {
      level: 5,
      name: "坐庄者，三仙戏法",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "取胜者，大小通吃",
      description: "施放爆发后强化夜兰的破局矢。",
    },
  ],
  damageProfile: {
    kind: "yelan",
    talentLabel: "渊图玲珑骰",
    controls: [
      {
        key: "yelanElementTypes",
        label: "队伍元素类型数量",
        defaultValue: "4",
        options: [1, 2, 3, 4].map((value) => ({
          value: String(value),
          label: `${value} 种元素`,
        })),
      },
      {
        key: "yelanAdaptWithEaseBonus",
        label: "妙转随心当前增伤",
        defaultValue: "25",
        options: [0, 1, 15, 25, 35, 50].map((value) => ({
          value: String(value),
          label: `${value}%`,
        })),
      },
    ],
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const multiplier = talentValue(
        exquisiteThrowDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "yelan-exquisite-throw",
          name: "玄掷玲珑（三箭合计）",
          description:
            "按一次协同攻击的三枚水箭合计；不将整组攻击错误地视为全段蒸发。",
          multiplierLabel: `3 × ${percent(multiplier)} 生命值上限`,
          baseDamage: panel.hp * multiplier * 3,
          category: "burst",
          reactions: ["none"],
          segments: Array.from({ length: 3 }, (_, index) => ({
            id: `yelan-exquisite-throw-arrow-${index + 1}`,
            name: `水箭第 ${index + 1} 段`,
            multiplierLabel: `${percent(multiplier)} 生命值上限`,
            baseDamage: panel.hp * multiplier,
          })),
        },
      ];
    },
  },
};
