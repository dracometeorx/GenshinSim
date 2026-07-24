import type { CharacterPreset } from "./types.ts";

const ozAttack = [
  0.888, 0.9546, 1.0212, 1.11, 1.1766, 1.2432, 1.332,
  1.4208, 1.5096, 1.5984, 1.6872, 1.776, 1.887,
] as const;

export const fischl: CharacterPreset = {
  id: "fischl",
  name: "菲谢尔",
  level: 90,
  baseHp: 9189,
  baseAtk: 244,
  baseDef: 594,
  ascensionStat: "atkPct",
  ascensionValue: 24,
  ascensionLabel: "攻击力 +24%",
  element: "electro",
  weaponType: "bow",
  defaultWeaponId: "the-stringless",
  burstEnergyCost: 60,
  hexerei: true,
  teamBuffs: [
    {
      id: "fischl-secret-overload",
      name: "魔导·秘仪·超载幻奏",
      description:
        "奥兹在场时，队伍触发超载后，菲谢尔与当前场上角色攻击力提高 22.5%。",
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.hexereiSecretRite
          ? [{ kind: "panel", stat: "atkPct", value: 22.5 }]
          : [],
    },
    {
      id: "fischl-secret-electro-charged",
      name: "魔导·秘仪·感电幻奏",
      description:
        "奥兹在场时，队伍触发感电或月感电后，菲谢尔与当前场上角色元素精通提高 90 点。",
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.hexereiSecretRite
          ? [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: 90,
              },
            ]
          : [],
    },
  ],
  damageProfile: {
    kind: "fischl",
    talentLabel: "夜巡影翼",
    controls: [],
    evaluateTargets: ({ panel, settings, talentValue }) => {
      const multiplier = talentValue(
        ozAttack,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "fischl-oz-attack",
          name: "奥兹单次攻击",
          description: "夜巡影翼召唤的奥兹单次雷元素伤害。",
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
        },
      ];
    },
  },
};
