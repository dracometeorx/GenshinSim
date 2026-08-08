import type { CharacterPreset } from "./types.ts";

const stormeyeTick = [
  0.376, 0.404, 0.432, 0.47, 0.498, 0.526, 0.564, 0.602,
  0.639, 0.677, 0.714, 0.752, 0.799,
] as const;

export const venti: CharacterPreset = {
  id: "venti",
  name: "温迪",
  level: 90,
  baseHp: 10531,
  baseAtk: 263,
  baseDef: 669,
  ascensionStat: "energyRecharge",
  ascensionValue: 32,
  ascensionLabel: "元素充能效率 +32%",
  element: "anemo",
  weaponType: "bow",
  defaultWeaponId: "skyward-harp",
  burstEnergyCost: 60,
  hexerei: true,
  teamBuffs: [
    {
      id: "venti-secret-swirl-damage",
      name: "魔导·秘仪·颂时风若",
      description:
        "暴风之眼存在期间，当前场上角色触发扩散后的 4 秒内，造成的伤害提高 50%。",
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.hexereiSecretRite
          ? [{ kind: "damage", stat: "damageBonus", value: 50 }]
          : [],
    },
    {
      id: "venti-c2-anemo-resistance",
      name: "C2·眷恋的泠风",
      description:
        "高天之歌使命中的敌人风元素抗性降低 12%；击飞期间合计降低 24%。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ source, target }) =>
        target.element === "anemo"
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                element: "anemo",
                value:
                  source.settings.selections.ventiC2EnemyState ===
                  "airborne"
                    ? 24
                    : 12,
              },
            ]
          : [],
    },
    {
      id: "venti-c4-anemo-damage",
      name: "C4·自由的凛风",
      description:
        "获取元素晶球或元素微粒后，温迪获得 25% 风元素伤害加成。",
      minConstellation: 4,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        { kind: "panel", stat: "elementalDmg", value: 25 },
      ],
    },
    {
      id: "venti-c6-burst-resistance",
      name: "C6·抗争的暴风",
      description:
        "受风神之诗伤害的敌人风抗降低 20%；发生元素转化时，对应元素抗性也降低 20%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ source, target }) => {
        const absorbed = source.settings.selections.ventiBurstAbsorption;
        return target.element === "anemo" || target.element === absorbed
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                element: target.element,
                value: 20,
              },
            ]
          : [];
      },
    },
  ],
  constellations: [
    {
      level: 1,
      name: "弦发的苍风",
      description: "瞄准射击额外发射两枚各造成原本 33% 伤害的分裂箭。",
    },
    {
      level: 2,
      name: "眷恋的泠风",
      description:
        "高天之歌使风元素抗性降低 12%，击飞期间额外降低 12%。",
    },
    {
      level: 3,
      name: "千风的诗篇",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "自由的凛风",
      description: "获取元素晶球或元素微粒后，风元素伤害提高 25%。",
    },
    {
      level: 5,
      name: "高天的协奏",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "抗争的暴风",
      description:
        "风神之诗使敌人风抗降低 20%，并降低元素转化对应元素抗性 20%。",
    },
  ],
  damageProfile: {
    kind: "venti",
    talentLabel: "风神之诗",
    controls: [
      {
        key: "ventiC2EnemyState",
        label: "C2 敌人状态",
        defaultValue: "grounded",
        options: [
          { value: "grounded", label: "已命中 · 风抗 -12%" },
          { value: "airborne", label: "击飞期间 · 风抗 -24%" },
        ],
      },
      {
        key: "ventiBurstAbsorption",
        label: "爆发元素转化",
        defaultValue: "none",
        options: [
          { value: "none", label: "未发生元素转化" },
          { value: "pyro", label: "火元素" },
          { value: "hydro", label: "水元素" },
          { value: "cryo", label: "冰元素" },
          { value: "electro", label: "雷元素" },
        ],
      },
    ],
    evaluateTargets: ({
      hexereiSecretRite,
      panel,
      settings,
      talentValue,
    }) => {
      const tick = talentValue(
        stormeyeTick,
        settings.burstTalentLevel,
      );
      const multiplier = tick * 20;
      return [
        {
          id: "venti-stormeye",
          name: "暴风之眼（20 跳风伤）",
          description: hexereiSecretRite
            ? "魔导·秘仪已开启，暴风之眼按原本 135% 伤害计算。"
            : "魔导·秘仪未开启，按原本持续伤害计算。",
          multiplierLabel: `${(
            multiplier *
            (hexereiSecretRite ? 1.35 : 1) *
            100
          ).toFixed(1)}% 攻击力`,
          baseDamage:
            panel.atk *
            multiplier *
            (hexereiSecretRite ? 1.35 : 1),
          category: "burst",
          reactions: ["none"],
          segments: Array.from({ length: 20 }, (_, index) => ({
            id: `venti-stormeye-tick-${index + 1}`,
            name: `风伤第 ${index + 1} 跳`,
            multiplierLabel: `${(
              tick *
              (hexereiSecretRite ? 1.35 : 1) *
              100
            ).toFixed(1)}% 攻击力`,
            baseDamage:
              panel.atk * tick * (hexereiSecretRite ? 1.35 : 1),
          })),
        },
      ];
    },
  },
};
