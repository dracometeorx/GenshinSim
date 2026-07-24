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
  ],
  damageProfile: {
    kind: "prune",
    talentLabel: "叮铃铃·猎魔之音",
    controls: [],
    evaluateTargets: ({ panel, settings, talentValue }) => {
      const multiplier = talentValue(
        transformedHammer,
        settings.skillTalentLevel,
      );
      return [
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
    },
  },
};
