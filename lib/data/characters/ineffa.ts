import type { CharacterPreset } from "./types.ts";
import { directLunarModel, lunarBaseBonusFromAtk } from "./lunar-common.ts";

export const ineffa: CharacterPreset = {
  id: "ineffa",
  name: "伊涅芙",
  level: 90,
  baseHp: 12613,
  baseAtk: 330,
  baseDef: 828,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "electro",
  weaponType: "polearm",
  defaultWeaponId: "fractured-halo",
  burstEnergyCost: 80,
  moonsign: true,
  teamBuffs: [
    {
      id: "ineffa-parameter-reconstruction",
      name: "全相重构协议",
      description:
        "施放元素爆发后，伊涅芙与当前场上角色的元素精通提高伊涅芙攻击力的 6%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: source.panel.atk * 0.06,
        },
      ],
    },
    {
      id: "ineffa-lunar-blessing",
      name: "月兆祝赐·象拟中继",
      description:
        "每 100 点攻击力使月感电基础伤害提高 0.7%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarBaseDamageBonus",
          value: lunarBaseBonusFromAtk(source.panel.atk),
          lunarReactions: ["lunarCharged"],
        },
      ],
    },
    {
      id: "ineffa-c1-conductive-compound",
      name: "C1·循环整流引擎",
      description:
        "月感电伤害提高伊涅芙每 100 点攻击力的 2.5%，至多 50%。",
      minConstellation: 1,
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarReactionDamageBonus",
          value: Math.min(50, (source.panel.atk / 100) * 2.5),
          lunarReactions: ["lunarCharged"],
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "循环整流引擎",
      description: "载流复合提高队伍月感电伤害。",
    },
    {
      level: 2,
      name: "辅助清理模块",
      description: "爆发命中后追加 300% 攻击力的直伤月感电。",
    },
    {
      level: 3,
      name: "高阶情感固件",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 5,
      name: "超越镜影之梦",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "献予你的明晨",
      description: "雷暴云雷击后追加 135% 攻击力的直伤月感电。",
    },
  ],
  damageProfile: {
    kind: "ineffa",
    talentLabel: "直伤月感电",
    controls: [],
    evaluateTargets: ({ constellation, panel, percent }) => {
      const targets = [
        {
          id: "ineffa-overclock",
          name: "频率超限回路",
          description:
            "仅计算薇尔琪塔追加的技能直伤；不计算雷暴云自身雷击。",
          multiplierLabel: "65% 攻击力",
          baseDamage: panel.atk * 0.65,
          category: "skill" as const,
          reactions: [],
          model: directLunarModel("lunarCharged"),
        },
      ];
      if (constellation >= 2) {
        targets.push({
          id: "ineffa-punishment-edict",
          name: "惩戒敕谕",
          description: "C2 爆发命中后的追加直伤月感电。",
          multiplierLabel: "300% 攻击力",
          baseDamage: panel.atk * 3,
          category: "burst",
          reactions: [],
          model: directLunarModel("lunarCharged"),
        });
      }
      if (constellation >= 6) {
        targets.push({
          id: "ineffa-morning",
          name: "献予你的明晨",
          description:
            "C6 雷暴云雷击后由伊涅芙直接追加的月感电伤害。",
          multiplierLabel: percent(1.35),
          baseDamage: panel.atk * 1.35,
          category: "skill",
          reactions: [],
          model: directLunarModel("lunarCharged"),
        });
      }
      return targets;
    },
  },
};
