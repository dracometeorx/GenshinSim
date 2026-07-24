import type { CharacterPreset } from "./types.ts";

const skillMultipliers = [
  2.392, 2.5714, 2.7508, 2.99, 3.1694, 3.3488, 3.588, 3.8272,
  4.0664, 4.3056,
] as const;
const burstCutMultipliers = [
  1.123, 1.207225, 1.29145, 1.40375, 1.487975, 1.5722, 1.6845,
  1.7968, 1.9091, 2.0214,
] as const;
const burstBloomMultipliers = [
  1.6845, 1.810837, 1.937175, 2.105625, 2.231962, 2.3583, 2.52675,
  2.6952, 2.86365, 3.0321,
] as const;

export const ayaka: CharacterPreset = {
  id: "ayaka",
  name: "神里绫华",
  level: 90,
  baseHp: 12858,
  baseAtk: 342,
  baseDef: 784,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "cryo",
  weaponType: "sword",
  defaultWeaponId: "mistsplitter",
  panelEffects: [
    {
      id: "ayaka-amatsumi-kunitsumi-sanctification",
      stage: "additive",
      conditional: true,
      evaluate: ({ damageSelections }) =>
        damageSelections.ayakaDashBonus === "active"
          ? [{ stat: "elementalDmg", value: 18 }]
          : [],
    },
  ],
  damageProfile: {
    kind: "ayaka",
    talentLabel: "战技 / 爆发等级",
    controls: [
      {
        key: "ayakaDashBonus",
        label: "霰步被动",
        defaultValue: "active",
        options: [
          { value: "active", label: "已触发（冰伤 +18%）" },
          { value: "inactive", label: "未触发" },
        ],
      },
    ],
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const skill = talentValue(
        skillMultipliers,
        settings.skillTalentLevel,
      );
      const cut = talentValue(
        burstCutMultipliers,
        settings.burstTalentLevel,
      );
      const bloom = talentValue(
        burstBloomMultipliers,
        settings.burstTalentLevel,
      );
      return [
        {
          id: "ayaka-skill",
          name: "神里流·冰华",
          description: "元素战技单次命中，不考虑融化反应。",
          multiplierLabel: `${percent(skill)} 攻击力`,
          baseDamage: panel.atk * skill,
          category: "skill",
          reactions: ["none"],
        },
        {
          id: "ayaka-burst",
          name: "神里流·霜灭（完整命中）",
          description: "按 19 次切割与 1 次绽放全部命中计算，不假设每段触发融化。",
          multiplierLabel: `19 × ${percent(cut)} + ${percent(bloom)}`,
          baseDamage: panel.atk * (cut * 19 + bloom),
          category: "burst",
          reactions: ["none"],
        },
      ];
    },
  },
};
