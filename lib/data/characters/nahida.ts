import type { CharacterPreset } from "./types.ts";

const triKarmaAtkMultipliers = [
  1.032, 1.1094, 1.1868, 1.29, 1.3674, 1.4448, 1.548, 1.6512,
  1.7544, 1.8576,
] as const;
const triKarmaEmMultipliers = [
  2.064, 2.2188, 2.3736, 2.58, 2.7348, 2.8896, 3.096, 3.3024,
  3.5088, 3.7152,
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
  damageProfile: {
    kind: "nahida",
    talentLabel: "元素战技等级",
    controls: [],
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
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
      return [
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
    },
  },
};
