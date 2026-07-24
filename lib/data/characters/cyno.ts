import type { CharacterPreset } from "./types.ts";
import {
  directStellarModel,
  stellarConductControls,
} from "./stellar-common.ts";

export const cyno: CharacterPreset = {
  id: "cyno",
  name: "赛诺",
  level: 90,
  baseHp: 12491,
  baseAtk: 318,
  baseDef: 859,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "electro",
  weaponType: "polearm",
  defaultWeaponId: "deathmatch",
  burstEnergyCost: 80,
  stellarConduct: "related",
  teamBuffs: [
    {
      id: "cyno-c1-mastery",
      name: "C1·皎辉精通",
      description: "进入皎辉状态后，赛诺与下一位前台角色元素精通提高 200 点。",
      minConstellation: 1,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [{ kind: "panel", stat: "elementalMastery", value: 200 }]
          : [],
    },
    {
      id: "cyno-c2-stellar",
      name: "C2·星电导强化",
      description: "普通攻击与重击叠满后，赛诺星反应伤害提高 80%。",
      minConstellation: 2,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "damage",
                stat: "stellarReactionDamageBonus",
                value: 80,
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    { level: 1, name: "立仪·俯瞰晦冥", description: "皎辉状态共享 200 点元素精通。" },
    { level: 2, name: "令仪·引谒归灵", description: "叠满后星反应伤害提高 80%。" },
    {
      level: 3,
      name: "律仪·行度誓惩",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 4, name: "巡仪·蒇护禁罔", description: "强化队伍能量回复。" },
    {
      level: 5,
      name: "幽仪·逝往星芒",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 6, name: "羽仪·裁落钧衡", description: "追加更多渡荒之雷的星电导直伤。" },
  ],
  damageProfile: {
    kind: "cyno",
    talentLabel: "渡荒之雷",
    controls: stellarConductControls,
    evaluateTargets: ({
      constellation,
      panel,
      stellarConductActive,
    }) => {
      if (!stellarConductActive) return [];
      const targets = [
        {
          id: "cyno-duststalker-stellar",
          name: "渡荒之雷·三枚合计",
          description:
            "末途真眼判定时释放三枚渡荒之雷；精通加成作为独立附加基础伤害结算。",
          multiplierLabel: "3 × 200% 攻击力 + 3 × 600% 元素精通",
          baseDamage: panel.atk * 2 * 3,
          category: "skill" as const,
          reactions: [],
          model: directStellarModel(),
          extraStellarAdditiveBaseDamage:
            panel.elementalMastery * 6 * 3,
        },
      ];
      if (constellation >= 6) {
        targets.push({
          id: "cyno-c6-duststalker-stellar",
          name: "C6·追加渡荒之雷",
          description: "命座追加的一枚渡荒之雷星电导直伤。",
          multiplierLabel: "200% 攻击力 + 600% 元素精通",
          baseDamage: panel.atk * 2,
          category: "skill",
          reactions: [],
          model: directStellarModel(),
          extraStellarAdditiveBaseDamage:
            panel.elementalMastery * 6,
        });
      }
      return targets;
    },
  },
};
