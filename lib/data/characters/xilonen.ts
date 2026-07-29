import type { CharacterPreset } from "./types.ts";

const burstDamage = [
  2.813, 3.024, 3.235, 3.516, 3.727, 3.938, 4.219,
  4.5, 4.782, 5.063, 5.344, 5.626, 5.977,
] as const;

function sourceSampleReduction(talentLevel: number) {
  const level = Number.isFinite(talentLevel)
    ? Math.round(talentLevel)
    : 1;
  return 9 + (Math.min(15, Math.max(1, level)) - 1) * 3;
}

export const xilonen: CharacterPreset = {
  id: "xilonen",
  name: "希诺宁",
  level: 90,
  baseHp: 12405,
  baseAtk: 275,
  baseDef: 930,
  ascensionStat: "defPct",
  ascensionValue: 36,
  ascensionLabel: "防御力 +36%",
  element: "geo",
  weaponType: "sword",
  defaultWeaponId: "favonius-sword",
  burstEnergyCost: 60,
  teamBuffs: [
    {
      id: "xilonen-source-samples",
      name: "源音采样",
      description:
        "源音采样激活时，降低目标对应的岩、火、水、冰或雷元素抗性；数值随元素战技等级变化。",
      appliesToSelf: true,
      evaluate: ({ source, target }) =>
        ["geo", "pyro", "hydro", "cryo", "electro"].includes(
          target.element,
        )
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                element: target.element,
                value: sourceSampleReduction(
                  source.settings.skillTalentLevel,
                ),
              },
            ]
          : [],
    },
    {
      id: "xilonen-c2-source-sample-bonus",
      name: "C2·献予灼原的五重奏",
      description:
        "源音采样激活时，岩伤提高 50%、火元素角色攻击力提高 45%、水元素角色生命值提高 45%、冰元素角色暴击伤害提高 60%；雷元素的回能与冷却缩减不进入伤害面板。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ target }) => {
        if (target.element === "geo") {
          return [
            {
              kind: "damage",
              stat: "damageBonus",
              value: 50,
            },
          ];
        }
        if (target.element === "pyro") {
          return [{ kind: "panel", stat: "atkPct", value: 45 }];
        }
        if (target.element === "hydro") {
          return [{ kind: "panel", stat: "hpPct", value: 45 }];
        }
        if (target.element === "cryo") {
          return [
            {
              kind: "damage",
              stat: "critDmg",
              value: 60,
            },
          ];
        }
        return [];
      },
    },
    {
      id: "xilonen-c4-blooming-blessing",
      name: "C4·荣花之赐",
      description:
        "施放元素战技后，普通攻击、重击与下落攻击获得相当于希诺宁防御力 65% 的基础伤害提升，最多生效 6 次。",
      minConstellation: 4,
      appliesToSelf: true,
      evaluate: ({ source }) =>
        (["normal", "charged", "plunge"] as const).map(
          (category) => ({
            kind: "damage" as const,
            stat: "additiveBaseDamage" as const,
            category,
            value: source.panel.def * 0.65,
          }),
        ),
    },
  ],
  constellations: [
    {
      level: 1,
      name: "献予慵眠的休假日",
      description: "降低夜魂值消耗并提高当前角色抗打断能力。",
    },
    {
      level: 2,
      name: "献予灼原的五重奏",
      description: "根据源音采样的元素类型强化对应元素角色。",
    },
    {
      level: 3,
      name: "献予日炎的巡行式",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "献予午后的花之梦",
      description:
        "为普通攻击、重击与下落攻击提供基于防御力的基础伤害提升。",
    },
    {
      level: 5,
      name: "献予夕暮的转格调",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "献予永夜的狂欢舞",
      description: "大幅强化夜魂加持状态下的输出与治疗。",
    },
  ],
  damageProfile: {
    kind: "xilonen",
    talentLabel: "豹烈律动！",
    controls: [],
    evaluateTargets: ({
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const multiplier = talentValue(
        burstDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "xilonen-burst",
          name: "豹烈律动！",
          description:
            "元素爆发初始岩元素范围伤害；辅助配队中的持续治疗不计入伤害结果。",
          multiplierLabel: `${percent(multiplier)} 防御力`,
          baseDamage: panel.def * multiplier,
          category: "burst",
          reactions: ["none"],
        },
      ];
    },
  },
};
