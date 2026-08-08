import type { CharacterPreset } from "./types.ts";

const firstNormalDamage = [
  0.475, 0.514, 0.552, 0.608, 0.646, 0.69, 0.751,
  0.812, 0.873, 0.939, 1.005, 1.072, 1.138,
] as const;
const masqueOfTheRedDeath = [
  1.204, 1.302, 1.4, 1.54, 1.638, 1.75, 1.904,
  2.058, 2.212, 2.38, 2.548, 2.716, 2.884,
] as const;

export const arlecchino: CharacterPreset = {
  id: "arlecchino",
  name: "阿蕾奇诺",
  level: 90,
  baseHp: 13103,
  baseAtk: 342,
  baseDef: 765,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "pyro",
  weaponType: "polearm",
  defaultWeaponId: "homa",
  burstEnergyCost: 60,
  panelEffects: [
    {
      id: "arlecchino-baleful-moon-alone-may-know",
      stage: "additive",
      evaluate: () => [{ stat: "elementalDmg", value: 40 }],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "所有的仇与债皆由我偿…",
      description: "红死之宴提升进一步提高 100%。",
    },
    {
      level: 2,
      name: "所有的赏与罚皆自我出…",
      description: "回收血偿勒令·结时追加厄月血火伤害。",
    },
    {
      level: 3,
      name: "你将成为我们新的家人…",
      description: "普通攻击等级提高 3 级。",
      talentLevelBonuses: { normal: 3 },
    },
    {
      level: 4,
      name: "此后，你们须相爱相护…",
      description: "回收血偿勒令时缩短爆发冷却并恢复能量。",
    },
    {
      level: 5,
      name: "我们已孑然一身，与死无异…",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "自此以后，我们将共飨新生。",
      description: "强化元素爆发，并提高普通攻击与爆发暴击属性。",
    },
  ],
  damageProfile: {
    kind: "arlecchino",
    talentLabel: "普通攻击·斩首之邀",
    controls: [
      {
        key: "arlecchinoBondOfLife",
        label: "当前生命之契",
        defaultValue: "130",
        options: [0, 65, 100, 130, 155, 200].map((value) => ({
          value: String(value),
          label: `${value}% 生命值上限`,
        })),
      },
    ],
    evaluateTargets: ({
      panel,
      settings,
      selection,
      talentValue,
      clamp,
      percent,
      constellation,
    }) => {
      const normal = talentValue(
        firstNormalDamage,
        settings.normalTalentLevel,
      );
      const masque =
        talentValue(
          masqueOfTheRedDeath,
          settings.normalTalentLevel,
        ) + (constellation >= 1 ? 1 : 0);
      const bondOfLife = clamp(
        Number(selection("arlecchinoBondOfLife")),
        0,
        200,
      );
      const combinedMultiplier = normal + masque * (bondOfLife / 100);
      return [
        {
          id: "arlecchino-masque-normal",
          name: "红死之宴·一段普通攻击",
          description: `按 ${bondOfLife}% 生命之契计算，计入固有天赋的 40% 火元素伤害加成。`,
          multiplierLabel: `${percent(normal)} + ${percent(masque)} × ${bondOfLife}%`,
          baseDamage: panel.atk * combinedMultiplier,
          category: "normal",
          reactions: ["none", "vaporize", "melt"],
          extraCritRate: constellation >= 6 ? 10 : 0,
          extraCritDmg: constellation >= 6 ? 70 : 0,
        },
      ];
    },
  },
};
