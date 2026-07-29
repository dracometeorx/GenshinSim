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
  ],
  damageProfile: {
    kind: "venti",
    talentLabel: "风神之诗",
    controls: [],
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
        },
      ];
    },
  },
};
