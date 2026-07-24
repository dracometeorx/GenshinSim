import type { CharacterPreset } from "./types.ts";
import type { DamageTarget } from "../../damage-types.ts";

const triKarmaAtkMultipliers = [
  1.032, 1.1094, 1.1868, 1.29, 1.3674, 1.4448, 1.548, 1.6512,
  1.7544, 1.8576, 1.9608, 2.064, 2.193,
] as const;
const triKarmaEmMultipliers = [
  2.064, 2.2188, 2.3736, 2.58, 2.7348, 2.8896, 3.096, 3.3024,
  3.5088, 3.7152, 3.9216, 4.128, 4.386,
] as const;

export const nahida: CharacterPreset = {
  id: "nahida",
  name: "纳西妲",
  level: 90,
  baseHp: 10360,
  baseAtk: 299,
  baseDef: 630,
  ascensionStat: "elementalMastery",
  ascensionValue: 115.2,
  ascensionLabel: "元素精通 +115.2",
  element: "dendro",
  weaponType: "catalyst",
  defaultWeaponId: "dreams",
  burstEnergyCost: 50,
  teamBuffs: [
    {
      id: "nahida-compassion-illuminated",
      name: "净善摄受明论",
      description:
        "摩耶之殿内，当前角色获得队伍最高元素精通的 25%，至多 250 点。",
      appliesToSelf: true,
      evaluate: ({ party }) => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: Math.min(
            250,
            party.highestElementalMastery * 0.25,
          ),
        },
      ],
    },
    {
      id: "nahida-c2-defense-down",
      name: "C2·正等善见之根",
      description:
        "蕴种印敌人处于激化状态时防御力降低 30%；仅用于蔓激化结果。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "enemyDefenseReduction",
          value: 30,
          reactions: ["spread"],
        },
      ],
    },
    {
      id: "nahida-c4-elemental-mastery",
      name: "C4·比量现行之茎",
      description:
        "单目标模式按 1 名蕴种印敌人计算，纳西妲元素精通提高 100 点。",
      minConstellation: 4,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: 100,
        },
      ],
    },
  ],
  constellations: [
    {
      level: 2,
      name: "正等善见之根",
      description:
        "激化相关状态下使蕴种印敌人的防御力降低 30%。",
    },
    {
      level: 3,
      name: "熏习成就之芽",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "比量现行之茎",
      description:
        "根据附近蕴种印敌人数量提高元素精通；单目标按 100 点计算。",
    },
    {
      level: 6,
      name: "大辨圆成之实",
      description:
        "爆发后普攻或重击可触发灭净三业·业障除。",
    },
  ],
  damageProfile: {
    kind: "nahida",
    talentLabel: "元素战技等级",
    controls: [],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const atkMultiplier = talentValue(
        triKarmaAtkMultipliers,
        settings.skillTalentLevel,
      );
      const emMultiplier = talentValue(
        triKarmaEmMultipliers,
        settings.skillTalentLevel,
      );
      const overTwoHundred = Math.max(
        0,
        panel.elementalMastery - 200,
      );
      const targets: DamageTarget[] = [
        {
          id: "nahida-tri-karma",
          name: "灭净三业",
          description: "按攻击力与元素精通双倍率计算；蔓激化加入当前角色等级对应的反应基础值。",
          multiplierLabel: `${percent(atkMultiplier)} 攻击力 + ${percent(emMultiplier)} 精通`,
          baseDamage:
            panel.atk * atkMultiplier +
            panel.elementalMastery * emMultiplier,
          category: "skill",
          reactions: ["none", "spread"],
          extraDamageBonus: Math.min(80, overTwoHundred * 0.1),
          extraCritRate: Math.min(24, overTwoHundred * 0.03),
        },
      ];
      if (constellation >= 6) {
        targets.push({
          id: "nahida-karmic-oblivion",
          name: "灭净三业·业障除",
          description:
            "C6 单次触发，按 200% 攻击力与 400% 元素精通计算。",
          multiplierLabel: "200% 攻击力 + 400% 精通",
          baseDamage: panel.atk * 2 + panel.elementalMastery * 4,
          category: "skill",
          reactions: ["none", "spread"],
          extraDamageBonus: Math.min(80, overTwoHundred * 0.1),
          extraCritRate: Math.min(24, overTwoHundred * 0.03),
        });
      }
      return targets;
    },
  },
};
