import type { CharacterPreset } from "./types.ts";
import { talentCurve } from "./lunar-common.ts";

const burstDamage = talentCurve(3.168);
const imageryDamage = [
  0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.71, 1.8,
] as const;

export const nicole: CharacterPreset = {
  id: "nicole",
  name: "尼可",
  level: 90,
  baseHp: 10409,
  baseAtk: 342,
  baseDef: 563,
  ascensionStat: "atkPct",
  ascensionValue: 28.8,
  ascensionLabel: "攻击力 +28.8%",
  element: "pyro",
  weaponType: "catalyst",
  defaultWeaponId: "lost-prayer",
  burstEnergyCost: 60,
  hexerei: true,
  teamBuffs: [
    {
      id: "nicole-guidance-attack",
      name: "虚己之赐·圣祝之引",
      description:
        "元素战技按尼可攻击力的 15% 提高当前角色攻击力，至多 600 点；升变后额外提高 300 点。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "panel",
          stat: "flatAtk",
          value: Math.min(600, source.panel.atk * 0.15) + 300,
        },
      ],
    },
    {
      id: "nicole-c2-guidance-bonus",
      name: "C2·我要教导你，指引你应走的路",
      description:
        "虚己之赐额外提高 300 点攻击力；圣祝之引生效时，附近敌人的对应元素抗性降低 25%，同元素不叠加。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ target }) => [
        {
          kind: "panel",
          stat: "flatAtk",
          value: 300,
        },
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          element: target.element,
          value: 25,
        },
      ],
    },
    {
      id: "nicole-secret-imagery",
      name: "魔导·秘仪·奥迹造影",
      description:
        "魔导角色的奥迹造影额外增加尼可 300% 攻击力的基础伤害。",
      appliesToSelf: false,
      evaluate: ({ source, target, party }) =>
        party.hexereiSecretRite && target.hexerei
          ? [
              {
                kind: "damage",
                stat: "additiveBaseDamage",
                value: source.panel.atk * 3,
              },
            ]
          : [],
    },
  ],
  damageProfile: {
    kind: "nicole",
    talentLabel: "圣言默示·天路历程",
    controls: [],
    evaluateTargets: ({
      hexereiSecretRite,
      panel,
      settings,
      talentValue,
    }) => {
      const burstMultiplier = talentValue(
        burstDamage,
        settings.burstTalentLevel,
      );
      const imageryMultiplier = talentValue(
        imageryDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "nicole-burst",
          name: "圣言默示·天路历程",
          description: "元素爆发初始火元素范围伤害。",
          multiplierLabel: `${(burstMultiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * burstMultiplier,
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        },
        {
          id: "nicole-imagery",
          name: "奥迹造影（自身触发）",
          description: hexereiSecretRite
            ? "魔导·秘仪已开启，额外计入尼可 300% 攻击力。"
            : "魔导·秘仪未开启，只计算天赋基础倍率。",
          multiplierLabel: `${(
            (imageryMultiplier + (hexereiSecretRite ? 3 : 0)) *
            100
          ).toFixed(1)}% 攻击力`,
          baseDamage:
            panel.atk *
            (imageryMultiplier + (hexereiSecretRite ? 3 : 0)),
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        },
      ];
    },
  },
};
