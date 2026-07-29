import type { CharacterPreset } from "./types.ts";
import type { DamageTarget } from "../../damage-types.ts";

const frostfallStormDamage = [
  0.17, 0.183, 0.196, 0.213, 0.226, 0.238, 0.255, 0.272,
  0.289, 0.306, 0.323, 0.34, 0.362,
] as const;
const iceStormDamage = [
  5.376, 5.779, 6.182, 6.72, 7.123, 7.526, 8.064, 8.602,
  9.139, 9.677, 10.214, 10.752, 11.424,
] as const;

export const citlali: CharacterPreset = {
  id: "citlali",
  name: "茜特菈莉",
  level: 90,
  baseHp: 11634,
  baseAtk: 127,
  baseDef: 763,
  ascensionStat: "elementalMastery",
  ascensionValue: 115,
  ascensionLabel: "元素精通 +115",
  element: "cryo",
  weaponType: "catalyst",
  defaultWeaponId: "sacrificial-fragments",
  burstEnergyCost: 60,
  teamBuffs: [
    {
      id: "citlali-frigid-rain-resistance",
      name: "五重天的寒雨",
      description:
        "伊兹帕帕存在期间触发冻结或融化后，敌人的火元素与水元素抗性降低 20%；C2 时合计降低 40%。",
      appliesToSelf: false,
      evaluate: ({ source, target }) =>
        target.element === "pyro" || target.element === "hydro"
          ? [
              {
                kind: "damage",
                stat: "enemyResistanceReduction",
                element: target.element,
                value: source.constellation >= 2 ? 40 : 20,
              },
            ]
          : [],
    },
    {
      id: "citlali-c1-stellar-blades",
      name: "C1·星刃",
      description:
        "其他当前场上角色造成伤害时，消耗星刃并加入相当于茜特菈莉元素精通 200% 的基础伤害。",
      minConstellation: 1,
      appliesToSelf: false,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "additiveBaseDamage",
          value: source.panel.elementalMastery * 2,
        },
      ],
    },
    {
      id: "citlali-c2-self-mastery",
      name: "C2·茜特菈莉元素精通",
      description: "茜特菈莉自身元素精通提高 125 点。",
      minConstellation: 2,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: 125,
        },
      ],
    },
    {
      id: "citlali-c2-party-mastery",
      name: "C2·白曜护盾元素精通",
      description:
        "处于白曜护盾庇护下或由伊兹帕帕跟随的其他角色元素精通提高 250 点。",
      minConstellation: 2,
      appliesToSelf: false,
      evaluate: () => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: 250,
        },
      ],
    },
    {
      id: "citlali-c6-secret-pact",
      name: "C6·秘律之数",
      description:
        "按满 40 点秘律之数计算，队伍火元素与水元素伤害加成提高 60%。",
      minConstellation: 6,
      appliesToSelf: false,
      evaluate: ({ target }) =>
        target.element === "pyro" || target.element === "hydro"
          ? [
              {
                kind: "damage",
                stat: "damageBonus",
                value: 60,
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "四百星的芒刃",
      description:
        "星刃为其他当前场上角色提供基于茜特菈莉元素精通的基础伤害。",
    },
    {
      level: 2,
      name: "吞心者的巡行",
      description: "提高元素精通，并强化火元素与水元素减抗。",
    },
    {
      level: 3,
      name: "云中蛇的羽冠",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "拒亡者的灵髑",
      description: "霜陨风暴额外召唤造成冰元素伤害的宿灵之髑。",
    },
    {
      level: 5,
      name: "五恶曜的咒缚",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "原动天的密契",
      description: "秘律之数提高全队火元素与水元素伤害。",
    },
  ],
  damageProfile: {
    kind: "citlali",
    talentLabel: "诸曜饬令",
    controls: [],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const frostfallMultiplier = talentValue(
        frostfallStormDamage,
        settings.skillTalentLevel,
      );
      const burstMultiplier = talentValue(
        iceStormDamage,
        settings.burstTalentLevel,
      );
      const targets: DamageTarget[] = [
        {
          id: "citlali-frostfall-storm",
          name: "伊兹帕帕·霜陨风暴",
          description:
            "单次霜陨风暴，包含固有天赋提供的 90% 元素精通倍率。",
          multiplierLabel: `${percent(frostfallMultiplier)} 攻击力 + 90% 元素精通`,
          baseDamage:
            panel.atk * frostfallMultiplier +
            panel.elementalMastery * 0.9,
          category: "skill",
          reactions: ["none", "melt"],
        },
        {
          id: "citlali-ice-storm",
          name: "诸曜饬令·冰风暴",
          description:
            "元素爆发冰风暴，包含固有天赋提供的 1200% 元素精通倍率。",
          multiplierLabel: `${percent(burstMultiplier)} 攻击力 + 1200% 元素精通`,
          baseDamage:
            panel.atk * burstMultiplier +
            panel.elementalMastery * 12,
          category: "burst",
          reactions: ["none", "melt"],
        },
      ];
      if (constellation >= 4) {
        targets.push({
          id: "citlali-c4-spirit-skull",
          name: "C4·宿灵之髑·黑星",
          description:
            "霜陨风暴命中后召唤的额外宿灵之髑，不视为元素爆发伤害。",
          multiplierLabel: "1800% 元素精通",
          baseDamage: panel.elementalMastery * 18,
          category: "skill",
          reactions: ["none", "melt"],
        });
      }
      return targets;
    },
  },
};
