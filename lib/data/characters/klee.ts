import type { DamageTarget } from "../../damage-types.ts";
import type { CharacterPreset } from "./types.ts";

const chargedAttack = [
  1.5736, 1.6916, 1.8096, 1.9669, 2.0849, 2.2029, 2.3603,
  2.5177, 2.675, 2.8324, 2.9898,
] as const;
const sparklyExplosion = [
  0.426, 0.458, 0.49, 0.533, 0.565, 0.597, 0.64, 0.682,
  0.725, 0.768, 0.81, 0.853, 0.906, 0.959, 1.013,
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
  teamBuffs: [
    {
      id: "klee-c2-defense-down",
      name: "C2·破破弹片",
      description: "蹦蹦炸弹的诡雷使敌人防御力降低 23%。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyDefenseReduction",
          value: 23,
        },
      ],
    },
    {
      id: "klee-c6-pyro-damage",
      name: "C6·火力全开",
      description: "施放轰轰火花后，全队获得 10% 火元素伤害加成。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ target }) =>
        target.element === "pyro"
          ? [{ kind: "damage", stat: "damageBonus", value: 10 }]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "连环轰隆",
      description:
        "攻击或施放技能时可召唤火花，造成轰轰火花单次攻击 120% 的伤害。",
    },
    {
      level: 2,
      name: "破破弹片",
      description: "蹦蹦炸弹的诡雷使敌人防御力降低 23%。",
    },
    {
      level: 3,
      name: "可莉特调",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "一触即发",
      description: "轰轰火花期间退场时，造成 555% 攻击力的火元素伤害。",
    },
    {
      level: 5,
      name: "轰击之星",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "火力全开",
      description: "施放元素爆发后，全队获得 10% 火元素伤害加成。",
    },
  ],
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
      constellation,
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
      const targets: DamageTarget[] = [
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
      if (constellation >= 1) {
        const spark =
          talentValue(
            sparklyExplosion,
            settings.burstTalentLevel,
          ) * 1.2;
        targets.push({
          id: "klee-c1-spark",
          name: "C1·连环轰隆火花",
          description: "按触发一次火花轰击计算。",
          multiplierLabel: `${(spark * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * spark,
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        });
      }
      if (constellation >= 4) {
        targets.push({
          id: "klee-c4-explosion",
          name: "C4·一触即发",
          description: "轰轰火花持续期间退场产生的爆炸。",
          multiplierLabel: "555% 攻击力",
          baseDamage: panel.atk * 5.55,
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        });
      }
      return targets;
    },
  },
};
