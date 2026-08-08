import type { CharacterPreset } from "./types.ts";
import { talentCurve } from "./lunar-common.ts";

const firstNormal = [
  0.54, 0.584, 0.628, 0.691, 0.735, 0.785, 0.854, 0.923,
  0.992, 1.067, 1.143,
] as const;
const heartPiercer = talentCurve(0.6);
const manifestJudgment = [
  1.188, 1.277, 1.366, 1.485, 1.574, 1.663, 1.782, 1.901,
  2.02, 2.138, 2.257, 2.376, 2.525, 2.673, 2.821,
] as const;

export const lohen: CharacterPreset = {
  id: "lohen",
  name: "洛恩",
  level: 90,
  baseHp: 12858,
  baseAtk: 344,
  baseDef: 784,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "cryo",
  weaponType: "polearm",
  defaultWeaponId: "calamity-queller",
  burstEnergyCost: 60,
  hexerei: true,
  teamBuffs: [
    {
      id: "lohen-c2-party-mastery",
      name: "C2·破邪之刃",
      description:
        "破邪之刃触发后，队伍中附近的其他角色元素精通提高 200 点。",
      minConstellation: 2,
      contributesToBuffSourcePanel: true,
      appliesToSelf: false,
      evaluate: () => [
        { kind: "panel", stat: "elementalMastery", value: 200 },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "往昔微风，载满悲歌",
      description: "争胜上限提高至 300 点，队友提供的争胜获取量提高。",
    },
    {
      level: 2,
      name: "凡飞翔者，皆为靶标",
      description:
        "获得破邪之刃，下一次普通或重击追加 500% 攻击力冰伤，并使其他队友精通提高 200 点。",
    },
    {
      level: 3,
      name: "唯有锋刃，能愈此伤",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "爱若流光，逝如欢歌",
      description: "奇谋状态下施放爆发时，将争胜积攒至当前上限。",
    },
    {
      level: 5,
      name: "无可窥探，无可质疑",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "身沦魂销，唯余欢悦",
      description:
        "镂骨彻心与元素爆发不消耗争胜，相关伤害暴击伤害提高 175%。",
    },
  ],
  damageProfile: {
    kind: "lohen",
    talentLabel: "奇兵诡出 / 西风枪术·破誓",
    controls: [
      {
        key: "lohenRivalry",
        label: "争胜",
        defaultValue: "100",
        options: [0, 50, 100, 150, 200, 250, 300].map((value) => ({
          value: String(value),
          label: `${value} 点${value === 100 ? "（C0 上限）" : value === 300 ? "（C1+ 上限）" : ""}`,
        })),
      },
    ],
    evaluateTargets: ({
      clamp,
      constellation,
      hexereiSecretRite,
      panel,
      selection,
      settings,
      talentValue,
    }) => {
      const rivalryMaximum = constellation >= 1 ? 300 : 100;
      const rivalry = clamp(
        Number(selection("lohenRivalry")) || 0,
        0,
        rivalryMaximum,
      );
      const normalMultiplier = talentValue(
        firstNormal,
        settings.normalTalentLevel,
      );
      const heartPiercerMultiplier =
        talentValue(heartPiercer, settings.skillTalentLevel) *
        4 *
        (1 + rivalry * 0.004);
      const heartPiercerHitMultiplier = heartPiercerMultiplier / 4;
      const burstRivalry =
        constellation >= 4 ? rivalryMaximum : rivalry;
      const burstMultiplier =
        talentValue(
          manifestJudgment,
          settings.burstTalentLevel,
        ) *
        6 *
        (1 + burstRivalry * 0.004);
      const c6CritDmg = constellation >= 6 ? 175 : 0;
      const targets = [
        {
          id: "lohen-first-normal",
          name: "奇谋·普通攻击第一段",
          description: hexereiSecretRite
            ? "魔导·秘仪已开启：争胜不少于 50% 时计入 40% 普通攻击伤害提升。"
            : "魔导·秘仪未开启，不计入课业天赋的 40% 普通攻击增伤。",
          multiplierLabel: `${(normalMultiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * normalMultiplier,
          category: "normal",
          reactions: ["none", "melt"],
          extraDamageBonus:
            hexereiSecretRite && rivalry >= 50 ? 40 : 0,
        },
        {
          id: "lohen-heart-piercer",
          name: "镂骨彻心（四段合计）",
          description: `按 ${rivalry} 点争胜计算，每点使原本伤害提高 0.4%。`,
          multiplierLabel: `${(heartPiercerMultiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * heartPiercerMultiplier,
          category: "skill",
          reactions: ["none", "melt"],
          extraCritDmg: c6CritDmg,
          segments: Array.from({ length: 4 }, (_, index) => ({
            id: `lohen-heart-piercer-${index + 1}`,
            name: `镂骨彻心第 ${index + 1} 段`,
            multiplierLabel: `${(heartPiercerHitMultiplier * 100).toFixed(1)}% 攻击力`,
            baseDamage: panel.atk * heartPiercerHitMultiplier,
          })),
        },
        {
          id: "lohen-burst",
          name: "裁罚遂成（六段合计）",
          description: `按 ${burstRivalry} 点争胜计算${constellation >= 4 ? "，C4 自动达到当前上限" : ""}。`,
          multiplierLabel: `${(burstMultiplier * 100).toFixed(1)}% 攻击力`,
          baseDamage: panel.atk * burstMultiplier,
          category: "burst" as const,
          reactions: ["none", "melt"] as const,
          extraCritDmg: c6CritDmg,
        },
      ];
      if (constellation >= 2) {
        targets.push({
          id: "lohen-c2-evilsbane",
          name: "C2·破邪之刃追加攻击",
          description: "下一次普通或重击命中时追加的冰元素范围伤害。",
          multiplierLabel: "500% 攻击力",
          baseDamage: panel.atk * 5,
          category: "normal" as const,
          reactions: ["none", "melt"] as const,
          extraCritDmg: 0,
        });
      }
      return targets;
    },
  },
};
