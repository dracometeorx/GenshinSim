import type { DamageTarget } from "../../damage-types.ts";
import { talentCurve } from "./lunar-common.ts";
import type { CharacterPreset } from "./types.ts";

const holdPhotoDamage = talentCurve(1.392);

export const charlotte: CharacterPreset = {
  id: "charlotte",
  name: "夏洛蒂",
  level: 90,
  baseHp: 10766,
  baseAtk: 173,
  baseDef: 546,
  ascensionStat: "atkPct",
  ascensionValue: 24,
  ascensionLabel: "攻击力 +24%",
  element: "cryo",
  weaponType: "catalyst",
  defaultWeaponId: "oathsworn-eye",
  burstEnergyCost: 80,
  teamBuffs: [
    {
      id: "charlotte-c2-attack",
      name: "C2·以求真为职守",
      description:
        "施放元素战技命中敌人后提高夏洛蒂攻击力；单目标模式按命中 1 名敌人的 10% 计算。",
      minConstellation: 2,
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        { kind: "panel", stat: "atkPct", value: 10 },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "以核实为约束",
      description: "元素爆发治疗后施加持续治疗印记。",
    },
    {
      level: 2,
      name: "以求真为职守",
      description: "元素战技命中敌人后提高夏洛蒂攻击力。",
    },
    {
      level: 3,
      name: "以独立为先决",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "以督促为责任",
      description: "元素爆发命中被战技标记的敌人时提高伤害并恢复能量。",
    },
    {
      level: 5,
      name: "以良知为原则",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 6,
      name: "以有趣相关为要义",
      description: "攻击聚焦印象目标时触发协同攻击与治疗。",
    },
  ],
  damageProfile: {
    kind: "charlotte",
    talentLabel: "取景·冰点构图法",
    controls: [],
    evaluateTargets: ({
      constellation,
      panel,
      settings,
      talentValue,
      percent,
    }) => {
      const multiplier = talentValue(
        holdPhotoDamage,
        settings.skillTalentLevel,
      );
      const targets: DamageTarget[] = [
        {
          id: "charlotte-hold-photo",
          name: "取景·长按拍照",
          description: "最大画幅长按元素战技造成的冰元素范围伤害。",
          multiplierLabel: `${percent(multiplier)} 攻击力`,
          baseDamage: panel.atk * multiplier,
          category: "skill",
          reactions: ["none", "melt"],
        },
      ];
      if (constellation >= 6) {
        targets.push({
          id: "charlotte-c6-coordinated",
          name: "C6·温亨廷先生协同攻击",
          description: "当前角色攻击聚焦印象目标后触发的一次冰元素协同攻击。",
          multiplierLabel: "180% 攻击力",
          baseDamage: panel.atk * 1.8,
          category: "burst",
          reactions: ["none", "melt"],
        });
      }
      return targets;
    },
  },
};
