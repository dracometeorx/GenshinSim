import type { DamageTarget } from "../../damage-types.ts";
import type { CharacterPreset } from "./types.ts";
import { talentCurve } from "./lunar-common.ts";

const transformedHammer = talentCurve(2.046);

export const prune: CharacterPreset = {
  id: "prune",
  name: "布伦妮",
  level: 90,
  baseHp: 9679,
  baseAtk: 221,
  baseDef: 580,
  ascensionStat: "atkPct",
  ascensionValue: 24,
  ascensionLabel: "攻击力 +24%",
  element: "anemo",
  weaponType: "catalyst",
  defaultWeaponId: "etherlight-spindlelute",
  burstEnergyCost: 70,
  hexerei: true,
  teamBuffs: [
    {
      id: "prune-ringing-inspiration",
      name: "振铃鼓舞",
      description:
        "布伦妮攻击力超过 2000 的部分，每点使普攻、重击、下落、战技与爆发伤害提高 0.025%，至多 50%。",
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "damageBonus",
          value: Math.min(
            50,
            Math.max(0, source.panel.atk - 2000) * 0.025,
          ),
        },
      ],
    },
    {
      id: "prune-secret-own-attack",
      name: "魔导·秘仪·寻魔之誓",
      description:
        "受振铃鼓舞的魔导角色触发反应后，布伦妮攻击力提高 60%。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) =>
        party.hexereiSecretRite
          ? [{ kind: "panel", stat: "atkPct", value: 60 }]
          : [],
    },
    {
      id: "prune-secret-swirl-attack",
      name: "魔导·秘仪·扩散强化",
      description:
        "受振铃鼓舞的魔导角色触发扩散后，其攻击力额外提高 30%。",
      evaluate: ({ target, party }) =>
        party.hexereiSecretRite && target.hexerei
          ? [{ kind: "panel", stat: "atkPct", value: 30 }]
          : [],
    },
    {
      id: "prune-c6-rally-attack",
      name: "C6·故事结尾在这儿",
      description:
        "处于振铃鼓舞影响下的角色触发元素反应后，布伦妮与当前场上受影响角色攻击力提高 350 点。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: () => [
        { kind: "panel", stat: "flatAtk", value: 350 },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "立下寻救的誓言，旅途由此开端",
      description: "元素转化后的狩灾誓锤命中时恢复元素能量。",
    },
    {
      level: 2,
      name: "整理杂乱的包袱，元素妙力果然",
      description:
        "寻猎模式下攻击力先提高 10%，命中继续叠加，最高提高 40%。",
      panelEffects: [
        {
          id: "prune-c2-witch-hunter-attack",
          stage: "additive",
          conditional: true,
          evaluate: ({ damageSelections }) => {
            const stacks = Math.min(
              6,
              Math.max(
                0,
                Number(damageSelections.pruneC2AttackStacks) || 0,
              ),
            );
            return [{ stat: "atkPct", value: 10 + stacks * 5 }];
          },
        },
      ],
    },
    {
      level: 3,
      name: "同旅商队过山关，眼眸景色又转",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "循风同行回头看，影子还缺一半",
      description:
        "元素转化后的狩灾誓锤命中后，再造成 80% 攻击力的对应元素伤害。",
    },
    {
      level: 5,
      name: "输了一百次不算，明日接着再战",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "故事结尾在这儿，念给伙伴听完",
      description:
        "寻猎模式延长；触发元素反应后，受振铃鼓舞角色攻击力提高 350 点。",
    },
  ],
  damageProfile: {
    kind: "prune",
    talentLabel: "叮铃铃·猎魔之音",
    controls: [
      {
        key: "pruneC2AttackStacks",
        label: "C2 寻猎魔女命中层数",
        defaultValue: "6",
        options: [0, 1, 2, 3, 4, 5, 6].map((value) => ({
          value: String(value),
          label: `${value} 层`,
        })),
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
    }) => {
      const multiplier = talentValue(
        transformedHammer,
        settings.skillTalentLevel,
      );
      const targets: DamageTarget[] = [
        {
          id: "prune-transformed-hammer",
          name: "咚锵锵·裁魔之惩",
          description:
            "计算发生元素转化后的特殊元素战技；结果仍按当前角色风元素面板显示。",
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
        },
      ];
      if (constellation >= 4) {
        targets.push({
          id: "prune-c4-ricochet",
          name: "C4·狩灾誓锤弹跳",
          description: "元素转化后的狩灾誓锤命中后追加的对应元素伤害。",
          multiplierLabel: "80% 攻击力",
          baseDamage: panel.atk * 0.8,
          category: "skill",
          reactions: ["none"],
        });
      }
      return targets;
    },
  },
};
