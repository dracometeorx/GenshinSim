import type { CharacterPreset } from "./types.ts";
import {
  directLunarModel,
  lunarBaseBonusFromEm,
  talentCurve,
} from "./lunar-common.ts";

const phantomTotal = talentCurve(3.2);

export const nefer: CharacterPreset = {
  id: "nefer",
  name: "奈芙尔",
  level: 90,
  baseHp: 12704,
  baseAtk: 344,
  baseDef: 799,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "dendro",
  weaponType: "catalyst",
  defaultWeaponId: "reliquary-of-truth",
  burstEnergyCost: 60,
  moonsign: true,
  teamBuffs: [
    {
      id: "nefer-lunar-blessing",
      name: "月兆祝赐·廊下暮影",
      description:
        "每点元素精通使月绽放基础伤害提高 0.0175%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source }) => {
        const layers = Number(
          source.settings.selections.neferVeilLayers ?? "0",
        );
        const required = source.constellation >= 2 ? 5 : 3;
        const veilMastery =
          layers >= required
            ? source.constellation >= 2
              ? 200
              : 100
            : 0;
        return [
          {
            kind: "damage",
            stat: "lunarBaseDamageBonus",
            value: lunarBaseBonusFromEm(
              source.panel.elementalMastery + veilMastery,
            ),
            lunarReactions: ["lunarBloom"],
          },
        ];
      },
    },
    {
      id: "nefer-false-veil-mastery",
      name: "月下的豪赌",
      description:
        "伪秘之帷叠满时提高奈芙尔元素精通；C2 上限提高后改为 200 点。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ source }) => {
        const layers = Number(
          source.settings.selections.neferVeilLayers ?? "0",
        );
        const required = source.constellation >= 2 ? 5 : 3;
        return layers >= required
          ? [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: source.constellation >= 2 ? 200 : 100,
              },
            ]
          : [];
      },
    },
    {
      id: "nefer-c4-dendro-resistance",
      name: "C4·眩惑入谜局之网",
      description: "影舞期间使附近敌人草元素抗性降低 20%。",
      minConstellation: 4,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: 20,
          element: "dendro",
        },
      ],
    },
    {
      id: "nefer-c6-elevation",
      name: "C6·决胜于逆转之时",
      description: "月兆·满辉时，奈芙尔月绽放伤害擢升 15%。",
      minConstellation: 6,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.moonsignLevel === "ascendant"
          ? [
              {
                kind: "damage",
                stat: "lunarElevation",
                value: 15,
                lunarReactions: ["lunarBloom"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "谋篇乃成败之始",
      description: "幻戏月绽放基础伤害额外加入 60% 元素精通。",
    },
    {
      level: 2,
      name: "明察为筹算之先",
      description: "伪秘之帷上限提高至 5 层，最高为原本 140%。",
    },
    {
      level: 3,
      name: "诳言掩虚实之迹",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "眩惑入谜局之网",
      description: "影舞期间降低敌人草抗 20%。",
    },
    {
      level: 5,
      name: "见机在忽微之间",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "决胜于逆转之时",
      description: "幻戏追加两段直伤月绽放，满辉时获得擢升。",
    },
  ],
  damageProfile: {
    kind: "nefer",
    talentLabel: "元素战技等级",
    controls: [
      {
        key: "neferVeilLayers",
        label: "伪秘之帷",
        defaultValue: "3",
        options: [
          { value: "0", label: "0 层" },
          { value: "1", label: "1 层" },
          { value: "2", label: "2 层" },
          { value: "3", label: "3 层" },
          { value: "4", label: "4 层（需 C2）" },
          { value: "5", label: "5 层（需 C2）" },
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
      const requestedLayers =
        Number(selection("neferVeilLayers")) || 0;
      const layers = Math.min(
        constellation >= 2 ? 5 : 3,
        Math.max(0, requestedLayers),
      );
      const veilMultiplier = 1 + layers * 0.08;
      const phantomMultiplier = talentValue(
        phantomTotal,
        settings.skillTalentLevel,
      );
      const targets = [
        {
          id: "nefer-phantom",
          name: "幻戏·虚影三段",
          description:
            "合计虚影三段直伤月绽放；伪秘之帷按当前层数乘算，不计算诳言之核伤害。",
          multiplierLabel: `${percent(phantomMultiplier)} 元素精通 × ${veilMultiplier.toFixed(2)}`,
          baseDamage:
            panel.elementalMastery *
            phantomMultiplier *
            veilMultiplier,
          category: "charged" as const,
          reactions: [],
          model: directLunarModel("lunarBloom"),
          extraLunarAdditiveBaseDamage:
            constellation >= 1
              ? panel.elementalMastery * 0.6 * veilMultiplier
              : 0,
          segments: Array.from({ length: 3 }, (_, index) => ({
            id: `nefer-phantom-${index + 1}`,
            name: `虚影第 ${index + 1} 段`,
            multiplierLabel: `${percent(phantomMultiplier / 3)} 元素精通 × ${veilMultiplier.toFixed(2)}`,
            baseDamage:
              (panel.elementalMastery *
                phantomMultiplier *
                veilMultiplier) /
              3,
          })),
        },
      ];
      if (constellation >= 6) {
        targets.push({
          id: "nefer-c6-phantom",
          name: "幻戏·C6 追加",
          description:
            "C6 幻戏第二段转化与结束追加的两段直伤月绽放合计。",
          multiplierLabel: "205% 元素精通",
          baseDamage: panel.elementalMastery * 2.05,
          category: "charged",
          reactions: [],
          model: directLunarModel("lunarBloom"),
        });
      }
      return targets;
    },
  },
};
