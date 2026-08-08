import type { DamageTarget } from "../../damage-types.ts";
import type { CharacterPreset } from "./types.ts";

const transientBlossom = [
  1.336, 1.4362, 1.5364, 1.67, 1.7702, 1.8704, 2.004,
  2.1376, 2.2712, 2.4048, 2.5384, 2.672, 2.839,
] as const;
const tectonicTide = [
  3.672, 3.947, 4.223, 4.59, 4.865, 5.141, 5.508, 5.875,
  6.242, 6.61, 6.977, 7.344, 7.803, 8.262, 8.721,
] as const;

export const albedo: CharacterPreset = {
  id: "albedo",
  name: "阿贝多",
  level: 90,
  baseHp: 13226,
  baseAtk: 251,
  baseDef: 876,
  ascensionStat: "elementalDmg",
  ascensionValue: 28.8,
  ascensionLabel: "岩元素伤害加成 +28.8%",
  element: "geo",
  weaponType: "sword",
  defaultWeaponId: "cinnabar-spindle",
  burstEnergyCost: 40,
  hexerei: true,
  teamBuffs: [
    {
      id: "albedo-burst-mastery",
      name: "瓶中人的天慧",
      description: "施放元素爆发后，附近队伍角色元素精通提高 125 点。",
      contributesToBuffSourcePanel: true,
      appliesToSelf: true,
      evaluate: () => [
        { kind: "panel", stat: "elementalMastery", value: 125 },
      ],
    },
    {
      id: "albedo-secret-creation-damage",
      name: "魔导·秘仪·白芒之书",
      description:
        "炼成阳华后按防御力为全队提供至多 12% 伤害加成；炼成瑰银后为魔导角色额外提供至多 30%。",
      appliesToSelf: true,
      evaluate: ({ source, target, party }) => {
        if (!party.hexereiSecretRite) return [];
        const common = Math.min(12, (source.panel.def / 1000) * 4);
        const hexerei = target.hexerei
          ? Math.min(30, (source.panel.def / 1000) * 10)
          : 0;
        return [
          {
            kind: "damage",
            stat: "damageBonus",
            value: common + hexerei,
          },
        ];
      },
    },
    {
      id: "albedo-c4-plunge-damage",
      name: "C4·神性之陨",
      description: "处于阳华领域时，下落攻击伤害提高 30%。",
      minConstellation: 4,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "damageBonus",
          category: "plunge",
          value: 30,
        },
      ],
    },
    {
      id: "albedo-c6-field-damage",
      name: "C6·无垢之土",
      description:
        "阳华领域中的当前角色处于结晶护盾庇护或领域中存在月笼时，伤害提高 17%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: () => [
        { kind: "damage", stat: "damageBonus", value: 17 },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "伊甸之花",
      description: "刹那之花绽放时为阿贝多恢复元素能量。",
    },
    {
      level: 2,
      name: "显生之宙",
      description:
        "生灭计数最多叠加 4 层，每层为爆发加入阿贝多防御力 30% 的基础伤害。",
    },
    {
      level: 3,
      name: "太阳之华",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "神性之陨",
      description: "阳华领域内当前角色的下落攻击伤害提高 30%。",
    },
    {
      level: 5,
      name: "冥古之潮",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "无垢之土",
      description:
        "阳华领域内处于结晶护盾庇护或存在月笼时，造成的伤害提高 17%。",
    },
  ],
  damageProfile: {
    kind: "albedo",
    talentLabel: "创生法·拟造阳华",
    controls: [
      {
        key: "albedoEnemyHp",
        label: "敌人生命",
        defaultValue: "below50",
        options: [
          { value: "above50", label: "高于 50%" },
          { value: "below50", label: "低于 50%" },
        ],
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      selection,
      settings,
      talentValue,
    }) => {
      const multiplier =
        talentValue(transientBlossom, settings.skillTalentLevel) +
        2.4;
      const targets: DamageTarget[] = [
        {
          id: "albedo-transient-blossom",
          name: "刹那之花·课业强化",
          description:
            "默认计入课业完成后额外 240% 防御力；低于半血时计入白垩色的威压。",
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 防御力`,
          baseDamage: panel.def * multiplier,
          category: "skill",
          reactions: ["none"],
          extraDamageBonus:
            selection("albedoEnemyHp") === "below50" ? 25 : 0,
        },
      ];
      if (constellation >= 2) {
        const burst = talentValue(
          tectonicTide,
          settings.burstTalentLevel,
        );
        targets.push({
          id: "albedo-c2-burst",
          name: "诞生式·大地之潮（C2 满层）",
          description: "按 4 层生灭计数计算，加入 120% 防御力基础伤害。",
          multiplierLabel: `${(burst * 100).toFixed(1)}% 攻击力 + 120% 防御力`,
          baseDamage: panel.atk * burst + panel.def * 1.2,
          category: "burst",
          reactions: ["none"],
        });
      }
      return targets;
    },
  },
};
