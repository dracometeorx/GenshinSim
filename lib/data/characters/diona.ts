import type { CharacterPreset } from "./types.ts";
import {
  stellarConductControls,
  talentCurve,
} from "./stellar-common.ts";

const icyPaw = talentCurve(0.419);

export const diona: CharacterPreset = {
  id: "diona",
  name: "迪奥娜",
  level: 90,
  baseHp: 9570,
  baseAtk: 212,
  baseDef: 601,
  ascensionStat: "elementalDmg",
  ascensionValue: 24,
  ascensionLabel: "冰元素伤害加成 +24%",
  element: "cryo",
  weaponType: "bow",
  defaultWeaponId: "favonius-warbow",
  burstEnergyCost: 80,
  stellarConduct: "related",
  teamBuffs: [
    {
      id: "diona-c6-stellar-support",
      name: "C6·猫尾特调",
      description:
        "最烈特调领域内，生命值高于 50% 时元素精通提高 200；皎辉状态下星电导伤害提高 40%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ party }) =>
        party.stellarConductActive
          ? [
              {
                kind: "panel",
                stat: "elementalMastery",
                value: 200,
              },
              {
                kind: "damage",
                stat: "stellarReactionDamageBonus",
                value: 40,
                stellarReactions: ["stellarConduct"],
              },
            ]
          : [],
    },
  ],
  constellations: [
    { level: 1, name: "特调的余韵", description: "恢复元素能量。" },
    { level: 2, name: "猫爪冰摇", description: "强化猫爪冻冻。" },
    {
      level: 3,
      name: "还、还要续杯？",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 4, name: "酒业杀手", description: "提高瞄准射击速度。" },
    {
      level: 5,
      name: "双份加冰",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 6, name: "猫尾打烊之时", description: "领域提供精通与星电导增伤。" },
  ],
  damageProfile: {
    kind: "diona",
    talentLabel: "猫爪冻冻",
    controls: stellarConductControls,
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const pawMultiplier = talentValue(
        icyPaw,
        settings.skillTalentLevel,
      );
      const multiplier = pawMultiplier * 5;
      return [
        {
          id: "diona-hold-skill",
          name: "猫爪冻冻·长按五枚",
          description:
            "迪奥娜本身不直接造成星电导伤害；冰猫爪可协助积累星极场元素力。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none"],
          segments: Array.from({ length: 5 }, (_, index) => ({
            id: `diona-hold-skill-paw-${index + 1}`,
            name: `冰猫爪第 ${index + 1} 枚`,
            multiplierLabel: `${percent(pawMultiplier)} 攻击力`,
            baseDamage: panel.atk * pawMultiplier,
          })),
        },
      ];
    },
  },
};
