import type { CharacterPreset } from "./types.ts";

const chargedAttack = [
  1.5736, 1.6916, 1.8096, 1.9669, 2.0849, 2.2029, 2.3603,
  2.5177, 2.675, 2.8324, 2.9898,
] as const;

export const klee: CharacterPreset = {
  id: "klee",
  name: "可莉",
  level: 90,
  baseHp: 10287,
  baseAtk: 311,
  baseDef: 615,
  ascensionStat: "elementalDmg",
  ascensionValue: 28.8,
  ascensionLabel: "火元素伤害加成 +28.8%",
  element: "pyro",
  weaponType: "catalyst",
  defaultWeaponId: "lost-prayer",
  burstEnergyCost: 60,
  hexerei: true,
  damageProfile: {
    kind: "klee",
    talentLabel: "砰砰 / 火花魔法",
    controls: [
      {
        key: "kleeBoomMedals",
        label: "轰轰勋章",
        defaultValue: "3",
        options: [
          { value: "0", label: "0 枚" },
          { value: "1", label: "1 枚" },
          { value: "2", label: "2 枚" },
          { value: "3", label: "3 枚" },
        ],
      },
    ],
    evaluateTargets: ({
      hexereiSecretRite,
      panel,
      selection,
      settings,
      talentValue,
    }) => {
      const medals = Number(selection("kleeBoomMedals")) || 0;
      const medalMultiplier =
        hexereiSecretRite && medals > 0
          ? [1, 1.15, 1.3, 1.5][medals] ?? 1
          : 1;
      const chargedMultiplier =
        talentValue(chargedAttack, settings.normalTalentLevel) *
        1.5 *
        medalMultiplier;
      return [
        {
          id: "klee-special-charged",
          name: "特殊重击·嘭嘭轰击",
          description: hexereiSecretRite
            ? `课业强化常驻 150%，并按 ${medals} 枚轰轰勋章计算秘仪倍率。`
            : "课业强化常驻 150%；未开启魔导·秘仪，不计轰轰勋章倍率。",
          multiplierLabel: `${(chargedMultiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * chargedMultiplier,
          category: "charged",
          reactions: ["none", "vaporize", "melt"],
        },
      ];
    },
  },
};
