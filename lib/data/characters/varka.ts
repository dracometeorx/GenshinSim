import type { DamageTarget } from "../../damage-types.ts";
import type { CharacterPreset } from "./types.ts";

const fourWindsFirstHit = [
  1.758, 1.889, 2.021, 2.197, 2.329, 2.461, 2.636, 2.812,
  2.988, 3.164, 3.339, 3.515, 3.735, 3.955, 4.174,
] as const;

const fourWindsSecondHit = [
  0.946, 1.017, 1.088, 1.183, 1.254, 1.325, 1.42, 1.514,
  1.609, 1.704, 1.798, 1.893, 2.011, 2.129, 2.248,
] as const;

export const varka: CharacterPreset = {
  id: "varka",
  name: "法尔伽",
  level: 90,
  baseHp: 12613,
  baseAtk: 353,
  baseDef: 795,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "anemo",
  weaponType: "claymore",
  defaultWeaponId: "wolfs-gravestone",
  burstEnergyCost: 60,
  hexerei: true,
  teamBuffs: [
    {
      id: "varka-c4-swirl-damage",
      name: "C4·歌唱的自由",
      description:
        "触发扩散后，全队获得 20% 风元素伤害与对应扩散元素伤害加成。",
      minConstellation: 4,
      appliesToSelf: true,
      evaluate: ({ source, target }) => {
        const swirlElement = source.settings.selections.varkaSwirlElement;
        return target.element === "anemo" || target.element === swirlElement
          ? [{ kind: "damage", stat: "damageBonus", value: 20 }]
          : [];
      },
    },
  ],
  constellations: [
    {
      level: 1,
      name: "「来吧，朋友，让我们在月下共舞」",
      description:
        "切换至狂飙突进后，首次四风将起或苍噬造成原本 200% 的伤害。",
      damageEffects: [
        {
          id: "varka-c1-double-skill",
          evaluate: ({ target }) =>
            target.id === "varka-four-winds"
              ? [{ stat: "baseDamageMultiplier", value: 100 }]
              : [],
        },
      ],
    },
    {
      level: 2,
      name: "「待天光破晓，我们便要踏上征途」",
      description:
        "施放四风将起或苍噬时，追加 800% 攻击力的风元素伤害。",
    },
    {
      level: 3,
      name: "「朋友，莫要再饮令人落泪的苦酒」",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "「因为无人能夺去我们歌唱的自由」",
      description:
        "触发扩散后，全队风元素与对应扩散元素伤害提高 20%。",
    },
    {
      level: 5,
      name: "「斟满杯中佳酿吧，暴君来了又去」",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "「我心爱的蒙德呀，依然屹立如初」",
      description:
        "狂飙突进获得额外连携；每层苍牙之誓使暴击伤害提高 20%。",
    },
  ],
  damageProfile: {
    kind: "varka",
    talentLabel: "烈风终坠",
    controls: [
      {
        key: "varkaOathStacks",
        label: "苍牙之誓",
        defaultValue: "4",
        options: [
          { value: "0", label: "0 层" },
          { value: "1", label: "1 层" },
          { value: "2", label: "2 层" },
          { value: "3", label: "3 层" },
          { value: "4", label: "4 层" },
        ],
      },
      {
        key: "varkaSwirlElement",
        label: "C4 扩散元素",
        defaultValue: "pyro",
        options: [
          { value: "pyro", label: "火元素" },
          { value: "hydro", label: "水元素" },
          { value: "cryo", label: "冰元素" },
          { value: "electro", label: "雷元素" },
        ],
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      selection,
      settings,
      talentValue,
      hexereiSecretRite,
    }) => {
      const stacks = Number(selection("varkaOathStacks")) || 0;
      const firstHitMultiplier = talentValue(
        fourWindsFirstHit,
        settings.skillTalentLevel,
      );
      const secondHitMultiplier = talentValue(
        fourWindsSecondHit,
        settings.skillTalentLevel,
      );
      const multiplier = firstHitMultiplier + secondHitMultiplier;
      const targets: DamageTarget[] = [
        {
          id: "varka-four-winds",
          name: "四风将起（二段合计）",
          description: `计入 ${stacks} 层苍牙之誓（每层 7.5% 增伤）。${
            hexereiSecretRite
              ? "魔导·秘仪已开启，冷却缩减条件生效，但不改变单次伤害。"
              : "魔导·秘仪未开启，不计入特殊战技冷却缩减。"
          }`,
          multiplierLabel: `${(multiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
          extraDamageBonus: stacks * 7.5,
          extraCritDmg: constellation >= 6 ? stacks * 20 : 0,
          segments: [
            {
              id: "varka-four-winds-first-hit",
              name: "四风将起第 1 段",
              multiplierLabel: `${(firstHitMultiplier * 100).toFixed(1)}% 攻击力`,
              baseDamage: panel.atk * firstHitMultiplier,
            },
            {
              id: "varka-four-winds-second-hit",
              name: "四风将起第 2 段",
              multiplierLabel: `${(secondHitMultiplier * 100).toFixed(1)}% 攻击力`,
              baseDamage: panel.atk * secondHitMultiplier,
            },
          ],
        },
      ];
      if (constellation >= 2) {
        targets.push({
          id: "varka-c2-followup",
          name: "C2·踏上征途",
          description: "施放四风将起时追加的一次风元素范围攻击。",
          multiplierLabel: "800% 攻击力",
          baseDamage: panel.atk * 8,
          category: "skill",
          reactions: ["none"],
          extraCritDmg: constellation >= 6 ? stacks * 20 : 0,
        });
      }
      return targets;
    },
  },
};
