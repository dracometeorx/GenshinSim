import type { CharacterPreset } from "./types.ts";
import {
  directLunarModel,
  lunarBaseBonusFromEm,
  talentCurve,
  talentValueAt,
} from "./lunar-common.ts";

const requiemPerDew = talentCurve(1.52);

export const lauma: CharacterPreset = {
  id: "lauma",
  name: "菈乌玛",
  level: 90,
  baseHp: 10654,
  baseAtk: 255,
  baseDef: 669,
  ascensionStat: "elementalMastery",
  ascensionValue: 115.2,
  ascensionLabel: "元素精通 +115.2",
  element: "dendro",
  weaponType: "catalyst",
  defaultWeaponId: "nightweavers-looking-glass",
  burstEnergyCost: 60,
  moonsign: true,
  teamBuffs: [
    {
      id: "lauma-lunar-blessing",
      name: "月兆祝赐·千籁恩宠",
      description:
        "每点元素精通使月绽放基础伤害提高 0.0175%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarBaseDamageBonus",
          value: lunarBaseBonusFromEm(
            source.panel.elementalMastery,
          ),
          lunarReactions: ["lunarBloom"],
        },
      ],
    },
    {
      id: "lauma-frost-grove-resistance",
      name: "霜林圣域",
      description:
        "元素战技命中后降低敌人草元素与水元素抗性。",
      appliesToSelf: true,
      evaluate: ({ source }) => {
        const value = talentValueAt(
          2.5,
          source.settings.skillTalentLevel,
        );
        return [
          {
            kind: "damage",
            stat: "enemyResistanceReduction",
            value,
            element: "dendro",
          },
          {
            kind: "damage",
            stat: "enemyResistanceReduction",
            value,
            element: "hydro",
          },
        ];
      },
    },
    {
      id: "lauma-full-moon-crit",
      name: "奉向霜夜的明光",
      description:
        "月兆·满辉时，队伍月绽放暴击率提高 10%、暴击伤害提高 20%。",
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "critRate",
                value: 10,
                lunarReactions: ["lunarBloom"],
              },
              {
                kind: "damage",
                stat: "critDmg",
                value: 20,
                lunarReactions: ["lunarBloom"],
              },
            ]
          : [],
    },
    {
      id: "lauma-pale-hymn",
      name: "苍色祷歌",
      description:
        "爆发层数可为一次月绽放增加基于菈乌玛元素精通的基础伤害。",
      appliesToSelf: true,
      evaluate: ({ source }) => {
        const baseMultiplier = talentValueAt(
          2.222,
          source.settings.burstTalentLevel,
        );
        const constellationMultiplier =
          source.constellation >= 2 ? 4 : 0;
        return [
          {
            kind: "damage",
            stat: "lunarAdditiveBaseDamage",
            value:
              source.panel.elementalMastery *
              (baseMultiplier + constellationMultiplier),
            lunarReactions: ["lunarBloom"],
          },
        ];
      },
    },
    {
      id: "lauma-c2-full-moon",
      name: "C2·终北的告诫与述说",
      description: "月兆·满辉时，队伍月绽放伤害提高 40%。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "lunarReactionDamageBonus",
                value: 40,
                lunarReactions: ["lunarBloom"],
              },
            ]
          : [],
    },
    {
      id: "lauma-c6-elevation",
      name: "C6·真实之物见证",
      description: "月兆·满辉时，队伍月绽放伤害擢升 25%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "lunarElevation",
                value: 25,
                lunarReactions: ["lunarBloom"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 2,
      name: "纺出那终北的告诫与述说",
      description: "强化苍色祷歌，满辉时提高月绽放伤害。",
    },
    {
      level: 3,
      name: "汝、切莫贪求狡狐的小径",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 5,
      name: "若是得以将真实之物见证",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "我愿将这血与泪奉予月明",
      description: "霜林圣域与普通攻击追加直伤月绽放。",
    },
  ],
  damageProfile: {
    kind: "lauma",
    talentLabel: "元素战技等级",
    controls: [
      {
        key: "laumaDewCount",
        label: "长按消耗草露",
        defaultValue: "3",
        options: [
          { value: "1", label: "1 枚" },
          { value: "2", label: "2 枚" },
          { value: "3", label: "3 枚" },
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
      const dewCount = Number(selection("laumaDewCount")) || 3;
      const perDew = talentValue(
        requiemPerDew,
        settings.skillTalentLevel,
      );
      const multiplier = perDew * dewCount;
      const targets = [
        {
          id: "lauma-eternal-rest",
          name: "永眠的祷歌",
          description:
            "长按战技消耗草露造成的技能直伤月绽放；不计算草原核及其后续反应。",
          multiplierLabel: `${dewCount} × ${percent(perDew)} 元素精通`,
          baseDamage: panel.elementalMastery * multiplier,
          category: "skill" as const,
          reactions: [],
          model: directLunarModel("lunarBloom"),
        },
      ];
      if (constellation >= 6) {
        targets.push(
          {
            id: "lauma-c6-domain",
            name: "霜林圣域·C6 追加",
            description: "C6 霜林圣域攻击时追加的直伤月绽放。",
            multiplierLabel: "185% 元素精通",
            baseDamage: panel.elementalMastery * 1.85,
            category: "skill",
            reactions: [],
            model: directLunarModel("lunarBloom"),
          },
          {
            id: "lauma-c6-normal",
            name: "苍色祷歌·普通攻击",
            description: "C6 消耗一层苍色祷歌转化的直伤月绽放。",
            multiplierLabel: "150% 元素精通",
            baseDamage: panel.elementalMastery * 1.5,
            category: "normal",
            reactions: [],
            model: directLunarModel("lunarBloom"),
          },
        );
      }
      return targets;
    },
  },
};
