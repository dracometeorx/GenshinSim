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
