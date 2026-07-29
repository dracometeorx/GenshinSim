import type { CharacterPreset } from "./types.ts";

const fourWinds = [
  1.758 + 0.946,
  1.889 + 1.017,
  2.021 + 1.088,
  2.197 + 1.183,
  2.329 + 1.254,
  2.461 + 1.325,
  2.636 + 1.42,
  2.812 + 1.514,
  2.988 + 1.609,
  3.164 + 1.704,
] as const;

export const varka: CharacterPreset = {
  id: "varka",
  name: "法尔伽",
  level: 90,
  baseHp: 12613,
  baseAtk: 353,
  baseDef: 795,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "anemo",
  weaponType: "claymore",
  defaultWeaponId: "wolfs-gravestone",
  burstEnergyCost: 60,
  hexerei: true,
  damageProfile: {
    kind: "varka",
    talentLabel: "烈风终坠",
    controls: [
      {
        key: "varkaOathStacks",
        label: "苍牙之誓",
        defaultValue: "4",
        options: [
          { value: "0", label: "0 层" },
          { value: "1", label: "1 层" },
          { value: "2", label: "2 层" },
          { value: "3", label: "3 层" },
          { value: "4", label: "4 层" },
        ],
      },
    ],
    evaluateTargets: ({
      panel,
      selection,
      settings,
      talentValue,
      hexereiSecretRite,
    }) => {
      const stacks = Number(selection("varkaOathStacks")) || 0;
      const multiplier = talentValue(
        fourWinds,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "varka-four-winds",
          name: "四风将起（二段合计）",
          description: `计入 ${stacks} 层苍牙之誓（每层 7.5% 增伤）。${
            hexereiSecretRite
              ? "魔导·秘仪已开启，冷却缩减条件生效，但不改变单次伤害。"
              : "魔导·秘仪未开启，不计入特殊战技冷却缩减。"
          }`,
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
          extraDamageBonus: stacks * 7.5,
        },
      ];
    },
  },
};
