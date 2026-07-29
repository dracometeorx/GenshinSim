import type { CharacterPreset } from "./types.ts";

const planetBefallDamage = [
  4.011, 4.444, 4.878, 5.42, 5.908, 6.396, 7.046, 7.696,
  8.347, 8.997, 9.648, 10.298, 10.84,
] as const;

export const zhongli: CharacterPreset = {
  id: "zhongli",
  name: "钟离",
  level: 90,
  baseHp: 14695,
  baseAtk: 251,
  baseDef: 738,
  ascensionStat: "elementalDmg",
  ascensionValue: 28.8,
  ascensionLabel: "岩元素伤害加成 +28.8%",
  element: "geo",
  weaponType: "polearm",
  defaultWeaponId: "favonius-lance",
  burstEnergyCost: 40,
  teamBuffs: [
    {
      id: "zhongli-jade-shield-resistance",
      name: "玉璋护盾·全元素减抗",
      description:
        "处于玉璋护盾庇护下时，附近敌人的所有元素抗性降低 20%。",
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyResistanceReduction",
          value: 20,
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "岩者，六合引之为骨",
      description: "地心创造的岩脊至多同时存在 2 个。",
    },
    {
      level: 2,
      name: "石者，八荒韫玉而明",
      description: "天星陨落时为当前场上角色赋予玉璋护盾。",
    },
    {
      level: 3,
      name: "圭璋，暝仍不移其晖",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "黄琮，破而不夺其坚",
      description: "扩大天星范围并延长石化时间。",
    },
    {
      level: 5,
      name: "苍璧，驱之长昭天理",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "金玉，礼予天地四方",
      description: "玉璋护盾受击时为当前角色恢复生命值。",
    },
  ],
  damageProfile: {
    kind: "zhongli",
    talentLabel: "天星",
    controls: [],
    evaluateTargets: ({
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const multiplier = talentValue(
        planetBefallDamage,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "zhongli-planet-befall",
          name: "天星",
          description:
            "元素爆发伤害，计入固有天赋「炊金馔玉」的 33% 生命值上限加成。",
          multiplierLabel: `${percent(multiplier)} 攻击力 + 33% 生命值`,
          baseDamage: panel.atk * multiplier + panel.hp * 0.33,
          category: "burst",
          reactions: ["none"],
        },
      ];
    },
  },
};
