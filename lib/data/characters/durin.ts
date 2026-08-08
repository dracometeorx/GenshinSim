import type { CharacterPreset } from "./types.ts";
import { talentCurve } from "./lunar-common.ts";

const whiteDragon = talentCurve(0.946);
const darkDragon = talentCurve(1.298);
const whiteDragonReactionElements = [
  "hydro",
  "cryo",
  "electro",
  "dendro",
  "anemo",
  "geo",
] as const;

function selectedWhiteDragonReactionElement(
  selections: Readonly<Record<string, string>>,
) {
  const selected = selections.durinWhiteReactionElement;
  return whiteDragonReactionElements.find(
    (element) => element === selected,
  );
}

export const durin: CharacterPreset = {
  id: "durin",
  name: "杜林",
  level: 90,
  baseHp: 12430,
  baseAtk: 347,
  baseDef: 822,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "pyro",
  weaponType: "sword",
  defaultWeaponId: "azurelight",
  burstEnergyCost: 70,
  hexerei: true,
  teamBuffs: [
    {
      id: "durin-white-dragon-resistance",
      name: "白焰之龙·光灵显现",
      description:
        "触发对应反应后降低敌人火元素及参与反应元素抗性；魔导·秘仪时由 20% 提高至 35%。",
      appliesToSelf: true,
      evaluate: ({ source, party }) => {
        if (source.settings.selections.durinForm === "dark") {
          return [];
        }
        const reactionElement = selectedWhiteDragonReactionElement(
          source.settings.selections,
        );
        return [
          {
            kind: "damage",
            stat: "enemyResistanceReduction",
            element: "pyro",
            value: party.hexereiSecretRite ? 35 : 20,
          },
          ...(reactionElement
            ? [
                {
                  kind: "damage" as const,
                  stat: "enemyResistanceReduction" as const,
                  element: reactionElement,
                  value: party.hexereiSecretRite ? 35 : 20,
                },
              ]
            : []),
        ];
      },
    },
    {
      id: "durin-dark-dragon-reaction",
      name: "黑蚀之龙·光灵显现",
      description:
        "杜林触发的蒸发与融化伤害提高 40%；魔导·秘仪时提高至 70%。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ source, party }) =>
        source.settings.selections.durinForm === "dark"
          ? [
              {
                kind: "damage",
                stat: "amplifyingReactionBonus",
                value: party.hexereiSecretRite ? 70 : 40,
                reactions: ["vaporize", "melt"],
              },
            ]
          : [],
    },
    {
      id: "durin-c1-white-enlightenment",
      name: "C1·轮变启迪·白化",
      description:
        "白化法施放后，其他当前场上角色的下一次伤害加入杜林攻击力 60% 的基础伤害。",
      minConstellation: 1,
      appliesToSelf: false,
      evaluate: ({ source }) =>
        source.settings.selections.durinForm === "white"
          ? [
              {
                kind: "damage",
                stat: "additiveBaseDamage",
                value: source.panel.atk * 0.6,
              },
            ]
          : [],
    },
    {
      id: "durin-c1-dark-enlightenment",
      name: "C1·轮变启迪·黑度",
      description:
        "黑度法施放后，杜林下一次元素爆发伤害加入自身攻击力 150% 的基础伤害。",
      minConstellation: 1,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ source }) =>
        source.settings.selections.durinForm === "dark"
          ? [
              {
                kind: "damage",
                stat: "additiveBaseDamage",
                category: "burst",
                value: source.panel.atk * 1.5,
              },
            ]
          : [],
    },
    {
      id: "durin-c2-reaction-elements",
      name: "C2·无底之想",
      description:
        "触发指定火元素相关反应后，火元素与参与反应的对应元素伤害提高 50%。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ source, target }) => {
        const reactionElement = selectedWhiteDragonReactionElement(
          source.settings.selections,
        );
        return target.element === "pyro" ||
          target.element === reactionElement
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                value: 50,
              },
            ]
          : [];
      },
    },
    {
      id: "durin-c6-white-defense-down",
      name: "C6·白化法减防",
      description:
        "白化法或白焰之龙命中后，敌人防御力降低 30%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ source }) =>
        source.settings.selections.durinForm === "white"
          ? [
              {
                kind: "damage",
                stat: "enemyDefenseReduction",
                value: 30,
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "红土之逆",
      description:
        "白化法为其他角色提供 60% 攻击力基础伤害；黑度法为杜林爆发提供 150% 攻击力基础伤害。",
    },
    {
      level: 2,
      name: "无底之想",
      description:
        "触发火元素相关反应后，火元素与参与反应元素伤害提高 50%。",
    },
    {
      level: 3,
      name: "焰镜之显",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "流溢之原",
      description: "杜林造成的元素爆发伤害提高 40%。",
      damageEffects: [
        {
          id: "durin-c4-burst-damage",
          evaluate: ({ target }) =>
            target.category === "burst"
              ? [{ stat: "damageBonus", value: 40 }]
              : [],
        },
      ],
    },
    {
      level: 5,
      name: "苦火之裂",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "双重诞生",
      description:
        "爆发无视 30% 防御；白化法降低 30% 防御，黑度法额外无视 40% 防御。",
      damageEffects: [
        {
          id: "durin-c6-defense-ignore",
          evaluate: ({ target }) =>
            target.category === "burst"
              ? [
                  {
                    stat: "enemyDefenseIgnore",
                    value:
                      target.id === "durin-dark-dragon" ? 70 : 30,
                  },
                ]
              : [],
        },
      ],
    },
  ],
  damageProfile: {
    kind: "durin",
    talentLabel: "白化法 / 黑度法·如光流变",
    controls: [
      {
        key: "durinForm",
        label: "力量形态",
        defaultValue: "white",
        options: [
          { value: "white", label: "白焰之龙" },
          { value: "dark", label: "黑蚀之龙" },
        ],
      },
      {
        key: "durinWhiteReactionElement",
        label: "白焰形态参与反应元素",
        defaultValue: "hydro",
        options: [
          { value: "hydro", label: "水元素" },
          { value: "cryo", label: "冰元素" },
          { value: "electro", label: "雷元素" },
          { value: "dendro", label: "草元素" },
          { value: "anemo", label: "风元素" },
          { value: "geo", label: "岩元素" },
        ],
      },
    ],
    evaluateTargets: ({ panel, selection, settings, talentValue }) => {
      const dark = selection("durinForm") === "dark";
      const multiplier = talentValue(
        dark ? darkDragon : whiteDragon,
        settings.burstTalentLevel,
      );
      return [
        {
          id: dark ? "durin-dark-dragon" : "durin-white-dragon",
          name: dark ? "黑蚀之龙单次攻击" : "白焰之龙单次攻击",
          description: dark
            ? "黑蚀形态可计算杜林触发的蒸发或融化。"
            : "白焰形态按单次火元素范围伤害计算。",
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "burst",
          reactions: dark
            ? ["none", "vaporize", "melt"]
            : ["none"],
        },
      ];
    },
  },
};
