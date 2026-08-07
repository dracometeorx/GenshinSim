import type { DamageTarget } from "../../damage-types.ts";
import type { CharacterPreset } from "./types.ts";

const thirdNormalDamage = [
  0.943, 1.014, 1.085, 1.179, 1.25, 1.32, 1.415, 1.509,
  1.603, 1.698, 1.792, 1.886, 2.004,
] as const;

const burstNormalHpBonus = [
  0.048, 0.052, 0.056, 0.06, 0.064, 0.068, 0.073, 0.077,
  0.082, 0.087, 0.092, 0.097, 0.103,
] as const;

export const kokomi: CharacterPreset = {
  id: "kokomi",
  name: "珊瑚宫心海",
  level: 90,
  baseHp: 13471,
  baseAtk: 234,
  baseDef: 657,
  ascensionStat: "elementalDmg",
  ascensionValue: 28.8,
  ascensionLabel: "水元素伤害加成 +28.8%",
  element: "hydro",
  weaponType: "catalyst",
  defaultWeaponId: "prototype-amber",
  burstEnergyCost: 70,
  panelEffects: [
    {
      id: "kokomi-flawless-strategy",
      stage: "additive",
      evaluate: () => [
        { stat: "healingBonus", value: 25 },
        { stat: "critRate", value: -100 },
      ],
    },
  ],
  teamBuffs: [
    {
      id: "kokomi-c6-hydro-damage",
      name: "C6·珊瑚一心",
      description:
        "仪来羽衣状态下治疗生命值不低于 80% 的角色后，心海获得 40% 水元素伤害加成。",
      minConstellation: 6,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ target }) =>
        target.element === "hydro"
          ? [{ kind: "damage", stat: "damageBonus", value: 40 }]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "决水于溪",
      description: "仪来羽衣状态下，普通攻击第三段额外释放游鱼。",
    },
    {
      level: 2,
      name: "波起云海",
      description: "强化对低生命值角色的治疗。",
    },
    {
      level: 3,
      name: "海渚月舟",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "月摄千川",
      description: "仪来羽衣状态下提高普通攻击速度并恢复能量。",
    },
    {
      level: 5,
      name: "百川集海",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "珊瑚一心",
      description: "满足治疗条件后获得 40% 水元素伤害加成。",
    },
  ],
  damageProfile: {
    kind: "kokomi",
    talentLabel: "海人化羽·普通攻击",
    controls: [],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const normalMultiplier = talentValue(
        thirdNormalDamage,
        settings.normalTalentLevel,
      );
      const burstHpMultiplier = talentValue(
        burstNormalHpBonus,
        settings.burstTalentLevel,
      );
      const pearlSongHpMultiplier =
        (panel.healingBonus / 100) * 0.15;
      const targets: DamageTarget[] = [
        {
          id: "kokomi-ceremonial-normal-third",
          name: "仪来羽衣·第三段普通攻击",
          description:
            "海人化羽状态下第三段普通攻击，计入生命值倍率与真珠御呗的治疗加成转换。",
          multiplierLabel: `${percent(normalMultiplier)} 攻击力 + ${percent(
            burstHpMultiplier + pearlSongHpMultiplier,
          )} 生命值`,
          baseDamage:
            panel.atk * normalMultiplier +
            panel.hp *
              (burstHpMultiplier + pearlSongHpMultiplier),
          category: "normal",
          reactions: ["none", "vaporize"],
        },
      ];
      if (constellation >= 1) {
        targets.push({
          id: "kokomi-c1-swimming-fish",
          name: "C1·游鱼追加",
          description:
            "仪来羽衣状态下第三段普通攻击释放的额外游鱼；单独列出，不并入普通攻击本体。",
          multiplierLabel: "30% 生命值",
          baseDamage: panel.hp * 0.3,
          category: "normal",
          reactions: ["none", "vaporize"],
        });
      }
      return targets;
    },
  },
};
