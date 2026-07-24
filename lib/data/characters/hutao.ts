import type { CharacterPreset } from "./types.ts";
import { hpStateOptions } from "../common.ts";

const chargedMultipliers = [
  1.3596, 1.4523, 1.545, 1.6686, 1.7613, 1.86945, 2.0085, 2.14755,
  2.2866, 2.42565,
] as const;
const skillHpToAtkRatios = [
  0.03841, 0.04071, 0.04301, 0.046, 0.0483, 0.0506, 0.05359,
  0.05658, 0.05957, 0.06256, 0.0655, 0.0685, 0.0715,
] as const;
const burstMultipliers = [
  3.03272, 3.21432, 3.39592, 3.632, 3.8136, 3.9952, 4.23128,
  4.46736, 4.70344, 4.93952, 5.1756, 5.4117, 5.6478,
] as const;
const lowHpBurstMultipliers = [
  3.7909, 4.0179, 4.2449, 4.54, 4.767, 4.994, 5.2891, 5.5842,
  5.8793, 6.1744, 6.4695, 6.7646, 7.0597,
] as const;

export const hutao: CharacterPreset = {
  id: "hutao",
  name: "胡桃",
  level: 90,
  baseHp: 15552,
  baseAtk: 106,
  baseDef: 876,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "pyro",
  weaponType: "polearm",
  defaultWeaponId: "homa",
  burstEnergyCost: 60,
  panelEffects: [
    {
      id: "hutao-sanguine-rouge",
      stage: "additive",
      conditional: true,
      evaluate: ({ damageSelections }) =>
        damageSelections.hutaoHpState === "below50"
          ? [{ stat: "elementalDmg", value: 33 }]
          : [],
    },
    {
      id: "hutao-paramita-papilio",
      stage: "conversion",
      conditional: true,
      evaluate: ({ baseAtk, panel, damageSettings }) => {
        const talentLevel = Math.min(
          skillHpToAtkRatios.length,
          Math.max(
            1,
            Math.round(damageSettings.skillTalentLevel),
          ),
        );
        const ratio = skillHpToAtkRatios[talentLevel - 1];
        return [
          {
            stat: "flatAtk",
            value: Math.min(panel.hp * ratio, baseAtk * 4),
          },
        ];
      },
    },
  ],
  teamBuffs: [
    {
      id: "hutao-flutter-by",
      name: "蝶隐之时",
      description:
        "蝶引来生状态结束后，除胡桃外的队友暴击率提高 12%。",
      evaluate: () => [
        { kind: "panel", stat: "critRate", value: 12 },
      ],
    },
    {
      id: "hutao-c4-crit-rate",
      name: "C4·伴君眠花房",
      description:
        "击败处于血梅香状态的敌人后，除胡桃外的队友暴击率提高 12%。",
      minConstellation: 4,
      evaluate: () => [
        { kind: "panel", stat: "critRate", value: 12 },
      ],
    },
    {
      id: "hutao-c6-crit-rate",
      name: "C6·幽蝶能留一缕芳",
      description:
        "命座触发期间暴击率提高 100%；仅作为胡桃自身的条件开关。",
      minConstellation: 6,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        { kind: "panel", stat: "critRate", value: 100 },
      ],
    },
  ],
  constellations: [
    {
      level: 3,
      name: "逗留采血色",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "伴君眠花房",
      description:
        "击败处于血梅香状态的敌人后，队友暴击率提高 12%。",
    },
    {
      level: 5,
      name: "无可奈何燃花作香",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "幽蝶能留一缕芳",
      description:
        "濒危时获得生存效果与 100% 暴击率；用独立增益开关表示触发状态。",
    },
  ],
  damageProfile: {
    kind: "hutao",
    talentLabel: "普攻 / 战技 / 爆发等级",
    controls: [
      {
        key: "hutaoHpState",
        label: "当前生命值",
        defaultValue: "below50",
        options: hpStateOptions,
      },
    ],
    evaluateTargets: ({
      panel,
      settings,
      selection,
      talentValue,
      percent,
    }) => {
      const charged = talentValue(
        chargedMultipliers,
        settings.normalTalentLevel,
      );
      const lowHp = selection("hutaoHpState") === "below50";
      const burst = talentValue(
        lowHp ? lowHpBurstMultipliers : burstMultipliers,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "hutao-charged",
          name: "蝶引来生·重击",
          description: `元素战技开启后攻击力 ${Math.round(panel.atk).toLocaleString("zh-CN")}；已计入生命转攻击与 400% 基础攻击上限。`,
          multiplierLabel: `${percent(charged)} 攻击力`,
          baseDamage: panel.atk * charged,
          category: "charged",
          reactions: ["none", "vaporize", "melt"],
        },
        {
          id: "hutao-burst",
          name: lowHp ? "安神秘法（低血量）" : "安神秘法",
          description: "按元素战技持续期间施放计算，使用同一生命状态与生命转攻击。",
          multiplierLabel: `${percent(burst)} 攻击力`,
          baseDamage: panel.atk * burst,
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        },
      ];
    },
  },
};
