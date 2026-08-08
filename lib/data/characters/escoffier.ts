import type { DamageTarget } from "../../damage-types.ts";
import { talentCurve } from "./lunar-common.ts";
import type { CharacterPreset } from "./types.ts";

const frostyParfaitDamage = talentCurve(1.2);

function cryoHydroResistanceReduction(
  elements: readonly string[],
) {
  const count = Math.min(
    4,
    elements.filter(
      (element) => element === "cryo" || element === "hydro",
    ).length,
  );
  return [0, 5, 10, 15, 55][count] ?? 0;
}

export const escoffier: CharacterPreset = {
  id: "escoffier",
  name: "爱可菲",
  level: 90,
  baseHp: 13348,
  baseAtk: 347,
  baseDef: 732,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "cryo",
  weaponType: "polearm",
  defaultWeaponId: "calamity-queller",
  burstEnergyCost: 60,
  teamBuffs: [
    {
      id: "escoffier-cryo-hydro-resistance",
      name: "灵感浸入调味",
      description:
        "战技或爆发命中后，按队伍冰/水角色数量使敌人的冰与水元素抗性降低 5%/10%/15%/55%。",
      appliesToSelf: true,
      evaluate: ({ target, party }) => {
        if (target.element !== "cryo" && target.element !== "hydro") {
          return [];
        }
        const value = cryoHydroResistanceReduction(party.elements);
        return value
          ? [
              {
                kind: "damage" as const,
                stat: "enemyResistanceReduction" as const,
                element: target.element,
                value,
              },
            ]
          : [];
      },
    },
    {
      id: "escoffier-c1-cryo-crit-damage",
      name: "C1·味蕾绽放的餐前旋舞",
      description:
        "四名角色均为冰或水元素时，队伍造成冰元素伤害的暴击伤害提高 60%。",
      minConstellation: 1,
      appliesToSelf: true,
      evaluate: ({ target, party }) =>
        target.element === "cryo" &&
        party.elements.every(
          (element) => element === "cryo" || element === "hydro",
        ) &&
        party.elements.length === 4
          ? [{ kind: "damage", stat: "critDmg", value: 60 }]
          : [],
    },
    {
      id: "escoffier-c2-cold-cooking",
      name: "C2·冷煮",
      description:
        "其他当前场上角色造成冰元素伤害时，单次消耗一层冷煮并加入爱可菲攻击力 240% 的基础伤害。",
      minConstellation: 2,
      appliesToSelf: false,
      evaluate: ({ source, target }) =>
        target.element === "cryo" &&
        target.characterId !== source.characterId
          ? [
              {
                kind: "damage",
                stat: "additiveBaseDamage",
                value: source.panel.atk * 2.4,
              },
            ]
          : [],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "味蕾绽放的餐前旋舞",
      description: "纯冰水队伍中，冰元素伤害暴击伤害提高 60%。",
    },
    {
      level: 2,
      name: "鲜香味腴的炖煮艺术",
      description: "冷煮为其他当前场上角色的冰元素伤害提供基础伤害。",
    },
    {
      level: 3,
      name: "焦糖褐变的烘烤魔法",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "迷迭生香的配比秘方",
      description: "延长康复食疗并强化治疗与回能。",
    },
    {
      level: 5,
      name: "千种酱汁的风味交响",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "虹彩缤纷的甜点茶话",
      description: "厨艺机关可发射额外的特级冻霜芭菲。",
    },
  ],
  damageProfile: {
    kind: "escoffier",
    talentLabel: "低温烹饪",
    controls: [],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const multiplier = talentValue(
        frostyParfaitDamage,
        settings.skillTalentLevel,
      );
      const targets: DamageTarget[] = [
        {
          id: "escoffier-frosty-parfait",
          name: "冻霜芭菲",
          description: "低温冷藏模式下厨艺机关的一次冰元素协同攻击。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none", "melt"],
        },
      ];
      if (constellation >= 6) {
        targets.push({
          id: "escoffier-c6-special-parfait",
          name: "C6·特级冻霜芭菲",
          description: "普通、重击或下落攻击命中后触发的一次额外协同攻击。",
          multiplierLabel: "500% 攻击力",
          baseDamage: panel.atk * 5,
          category: "skill",
          reactions: ["none", "melt"],
        });
      }
      return targets;
    },
  },
};
