import type { CharacterPreset } from "./types.ts";
import {
  directLunarModel,
  lunarBaseBonusFromDef,
  talentCurve,
} from "./lunar-common.ts";

const empoweredHammer = talentCurve(1);
const megatonHammer = talentCurve(4);

export const linnea: CharacterPreset = {
  id: "linnea",
  name: "莉奈娅",
  level: 90,
  baseHp: 9895,
  baseAtk: 144,
  baseDef: 907,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "geo",
  weaponType: "bow",
  defaultWeaponId: "frostbound-oath",
  burstEnergyCost: 60,
  moonsign: true,
  teamBuffs: [
    {
      id: "linnea-geo-resistance",
      name: "野外观察手记",
      description:
        "露米附近敌人岩抗降低 15%；月兆·满辉时合计降低 30%。",
      appliesToSelf: true,
      evaluate: ({ party }) => [
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: party.moonsignLevel === "ascendant" ? 30 : 15,
          element: "geo",
        },
      ],
    },
    {
      id: "linnea-field-mastery",
      name: "万类博物图鉴",
      description:
        "若当前场上角色为月兆角色，其元素精通提高莉奈娅防御力的 5%。",
      appliesToSelf: true,
      evaluate: ({ source, target }) =>
        target.moonsign
          ? [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: source.panel.def * 0.05,
              },
            ]
          : [],
    },
    {
      id: "linnea-lunar-blessing",
      name: "月兆祝赐·栖地考察",
      description:
        "每 100 点防御力使月结晶基础伤害提高 0.7%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarBaseDamageBonus",
          value: lunarBaseBonusFromDef(source.panel.def),
          lunarReactions: ["lunarCrystallize"],
        },
      ],
    },
    {
      id: "linnea-c1-record",
      name: "C1·历览编录",
      description:
        "队伍造成月结晶伤害时，消耗一层并增加莉奈娅 75% 防御力的基础伤害。",
      minConstellation: 1,
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarAdditiveBaseDamage",
          value: source.panel.def * 0.75,
          lunarReactions: ["lunarCrystallize"],
        },
      ],
    },
    {
      id: "linnea-c2-hydro-geo-crit",
      name: "C2·喜或悲的谕告",
      description:
        "触发月笼谐奏后，水元素与岩元素角色暴击伤害提高 40%。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "critDmg",
          value: 40,
          element: "hydro",
        },
        {
          kind: "damage",
          stat: "critDmg",
          value: 40,
          element: "geo",
        },
      ],
    },
    {
      id: "linnea-c4-defense",
      name: "C4·专家的直感觉",
      description:
        "触发月笼谐奏后，莉奈娅与当前场上角色防御力提高 25%。",
      minConstellation: 4,
      appliesToSelf: true,
      evaluate: () => [
        { kind: "panel", stat: "defPct", value: 25 },
      ],
    },
    {
      id: "linnea-c6-elevation",
      name: "C6·黄金猎犬之梦",
      description: "月兆·满辉时，队伍月结晶伤害擢升 25%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "lunarElevation",
                value: 25,
                lunarReactions: ["lunarCrystallize"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "未完成的分类",
      description: "历览编录为队伍月结晶增加防御力基础伤害。",
    },
    {
      level: 2,
      name: "喜或悲的谕告",
      description: "水与岩元素角色暴伤提高，强化露米重锤。",
    },
    {
      level: 3,
      name: "热闹的记录页",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "专家的直感觉",
      description: "触发月笼谐奏后提高防御力。",
    },
    {
      level: 5,
      name: "仙乡的赠别礼",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "黄金猎犬之梦",
      description: "强化历览编录，满辉时获得月结晶擢升。",
    },
  ],
  damageProfile: {
    kind: "linnea",
    talentLabel: "元素战技等级",
    controls: [
      {
        key: "linneaRecordLayers",
        label: "百万吨重锤消耗历览编录",
        defaultValue: "5",
        options: [
          { value: "0", label: "0 层" },
          { value: "1", label: "1 层" },
          { value: "2", label: "2 层" },
          { value: "3", label: "3 层" },
          { value: "4", label: "4 层" },
          { value: "5", label: "5 层" },
        ],
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      selection,
      settings,
      talentValue,
      percent,
    }) => {
      const hammerMultiplier = talentValue(
        megatonHammer,
        settings.skillTalentLevel,
      );
      const recordLayers = Math.min(
        5,
        Math.max(0, Number(selection("linneaRecordLayers")) || 0),
      );
      const recordBase =
        constellation >= 1
          ? panel.def * 1.5 * recordLayers
          : 0;
      const empoweredMultiplier = talentValue(
        empoweredHammer,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "linnea-megaton-hammer",
          name: "露米·百万吨重锤",
          description:
            "究极厉害形态的技能直伤月结晶；不计算月笼谐奏。C1 可按层数加入历览编录。",
          multiplierLabel: `${percent(hammerMultiplier)} 防御力${
            recordLayers && constellation >= 1
              ? ` + ${recordLayers} × 150% 防御力`
              : ""
          }`,
          baseDamage: panel.def * hammerMultiplier,
          category: "skill",
          reactions: [],
          model: directLunarModel("lunarCrystallize"),
          extraLunarAdditiveBaseDamage: recordBase,
          extraCritDmg: constellation >= 2 ? 150 : 0,
        },
        {
          id: "linnea-empowered-hammer",
          name: "露米·加力重锤",
          description:
            "附近存在月笼时由技能直接造成的月结晶伤害；不计算月笼本体。",
          multiplierLabel: `${percent(empoweredMultiplier)} 防御力`,
          baseDamage: panel.def * empoweredMultiplier,
          category: "skill",
          reactions: [],
          model: directLunarModel("lunarCrystallize"),
        },
      ];
    },
  },
};
