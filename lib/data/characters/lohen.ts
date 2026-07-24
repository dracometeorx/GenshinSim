import type { CharacterPreset } from "./types.ts";
import { talentCurve } from "./lunar-common.ts";

const firstNormal = [
  0.54, 0.584, 0.628, 0.691, 0.735, 0.785, 0.854, 0.923,
  0.992, 1.067, 1.143,
] as const;
const heartPiercer = talentCurve(0.6);

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
  damageProfile: {
    kind: "lohen",
    talentLabel: "奇兵诡出 / 西风枪术·破誓",
    controls: [
      {
        key: "lohenRivalry",
        label: "争胜",
        defaultValue: "100",
        options: [
          { value: "0", label: "0 点" },
          { value: "50", label: "50 点" },
          { value: "100", label: "100 点（上限）" },
        ],
      },
    ],
    evaluateTargets: ({
      hexereiSecretRite,
      panel,
      selection,
      settings,
      talentValue,
    }) => {
      const rivalry = Number(selection("lohenRivalry")) || 0;
      const normalMultiplier = talentValue(
        firstNormal,
        settings.normalTalentLevel,
      );
      const heartPiercerMultiplier =
        talentValue(heartPiercer, settings.skillTalentLevel) *
        4 *
        (1 + rivalry * 0.004);
      return [
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
        },
      ];
    },
  },
};
