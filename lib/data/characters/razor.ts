import type { DamageTarget } from "../../damage-types.ts";
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
  teamBuffs: [
    {
      id: "razor-c1-damage",
      name: "C1·狼性",
      description: "获取元素晶球或元素微粒后，造成的伤害提高 10%。",
      minConstellation: 1,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        { kind: "damage", stat: "damageBonus", value: 10 },
      ],
    },
    {
      id: "razor-c2-crit-rate",
      name: "C2·压制",
      description: "攻击生命值低于 30% 的敌人时，暴击率提高 10%。",
      minConstellation: 2,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        { kind: "damage", stat: "critRate", value: 10 },
      ],
    },
    {
      id: "razor-c4-defense-down",
      name: "C4·撕咬",
      description: "元素战技点按命中后，敌人防御力降低 15%。",
      minConstellation: 4,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyDefenseReduction",
          value: 15,
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "狼性",
      description: "获取元素晶球或元素微粒后，造成的伤害提高 10%。",
    },
    {
      level: 2,
      name: "压制",
      description: "攻击生命值低于 30% 的敌人时，暴击率提高 10%。",
    },
    {
      level: 3,
      name: "兽魂",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "撕咬",
      description: "元素战技点按使敌人防御力降低 15%。",
    },
    {
      level: 5,
      name: "利爪",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "天狼",
      description: "下一次普通攻击附带 100% 攻击力的雷元素落雷。",
    },
  ],
  damageProfile: {
    kind: "razor",
    talentLabel: "利爪与苍雷 / 雷牙",
    controls: [],
    evaluateTargets: ({
      constellation,
      hexereiSecretRite,
      panel,
      settings,
      talentValue,
    }) => {
      const clawMultiplier = talentValue(
        clawDamage,
        settings.skillTalentLevel,
      );
      const targets: DamageTarget[] = [
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
      if (constellation >= 6) {
        targets.push({
          id: "razor-c6-lightning",
          name: "C6·天狼落雷",
          description: "充能后的下一次普通攻击引发的雷元素伤害。",
          multiplierLabel: "100% 攻击力",
          baseDamage: panel.atk,
          category: "normal",
          reactions: ["none"],
        });
      }
      return targets;
    },
  },
};
