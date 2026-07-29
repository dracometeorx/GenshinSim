import type { CharacterPreset } from "./types.ts";

const clawDamage = [
  1.99, 2.14, 2.29, 2.49, 2.64, 2.79, 2.99, 3.19, 3.39,
  3.586, 3.785, 3.984, 4.233,
] as const;

export const razor: CharacterPreset = {
  id: "razor",
  name: "雷泽",
  level: 90,
  baseHp: 11962,
  baseAtk: 234,
  baseDef: 751,
  ascensionStat: "none",
  ascensionValue: 0,
  ascensionLabel: "物理伤害加成 +30%（不计入雷伤面板）",
  element: "electro",
  weaponType: "claymore",
  defaultWeaponId: "wolfs-gravestone",
  burstEnergyCost: 80,
  hexerei: true,
  damageProfile: {
    kind: "razor",
    talentLabel: "利爪与苍雷 / 雷牙",
    controls: [],
    evaluateTargets: ({
      hexereiSecretRite,
      panel,
      settings,
      talentValue,
    }) => {
      const clawMultiplier = talentValue(
        clawDamage,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "razor-claw",
          name: "利爪与苍雷（点按）",
          description: "元素战技点按造成的雷元素伤害。",
          multiplierLabel: `${(clawMultiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * clawMultiplier,
          category: "skill",
          reactions: ["none"],
        },
        {
          id: "razor-wolf-homework",
          name: "雷狼·课业强化追击",
          description: hexereiSecretRite
            ? "课业完成常驻额外 70% 攻击力；秘仪开启时同时列入雷之印溢出的 150% 落雷。"
            : "课业完成常驻额外 70% 攻击力；未开启秘仪，不计入溢出落雷。",
          multiplierLabel: `${hexereiSecretRite ? "220" : "70"}% 攻击力`,
          baseDamage:
            panel.atk * (hexereiSecretRite ? 2.2 : 0.7),
          category: "burst",
          reactions: ["none"],
        },
      ];
    },
  },
};
