import type { DamageTarget } from "../../damage-types.ts";
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
  constellations: [
    {
      level: 1,
      name: "幽邃鸦眼",
      description: "奥兹不在场时，普通攻击附带 22% 攻击力的协同攻击。",
    },
    {
      level: 2,
      name: "圣裁影羽",
      description: "施放元素战技时额外造成 200% 攻击力的伤害。",
    },
    {
      level: 3,
      name: "渊色黑翼",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "皇女幻绮谭",
      description: "施放元素爆发时额外造成 222% 攻击力的雷元素伤害。",
    },
    {
      level: 5,
      name: "至夜默示录",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "永夜之禽",
      description:
        "奥兹协同当前场上角色攻击，造成菲谢尔 30% 攻击力的雷元素伤害。",
    },
  ],
  damageProfile: {
    kind: "fischl",
    talentLabel: "夜巡影翼",
    controls: [],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
    }) => {
      const multiplier = talentValue(
        ozAttack,
        settings.skillTalentLevel,
      );
      const targets: DamageTarget[] = [
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
      if (constellation >= 2) {
        targets.push({
          id: "fischl-c2-summon",
          name: "C2·圣裁影羽",
          description: "施放夜巡影翼时造成的额外雷元素伤害。",
          multiplierLabel: "200% 攻击力",
          baseDamage: panel.atk * 2,
          category: "skill",
          reactions: ["none"],
        });
      }
      if (constellation >= 4) {
        targets.push({
          id: "fischl-c4-burst",
          name: "C4·皇女幻绮谭",
          description: "施放至夜幻现时造成的额外雷元素范围伤害。",
          multiplierLabel: "222% 攻击力",
          baseDamage: panel.atk * 2.22,
          category: "burst",
          reactions: ["none"],
        });
      }
      if (constellation >= 6) {
        targets.push({
          id: "fischl-c6-coordinated",
          name: "C6·奥兹协同攻击",
          description: "当前场上角色攻击时，奥兹进行一次协同攻击。",
          multiplierLabel: "30% 攻击力",
          baseDamage: panel.atk * 0.3,
          category: "skill",
          reactions: ["none"],
        });
      }
      return targets;
    },
  },
};
