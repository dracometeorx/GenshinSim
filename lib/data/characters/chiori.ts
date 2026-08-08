import type { CharacterPreset } from "./types.ts";

const tamotoAtkDamage = [
  0.821, 0.882, 0.944, 1.026, 1.088, 1.149, 1.231,
  1.313, 1.395, 1.477, 1.56, 1.642, 1.744, 1.847, 1.949,
] as const;
const tamotoDefDamage = [
  1.026, 1.103, 1.18, 1.283, 1.359, 1.436, 1.539,
  1.642, 1.744, 1.847, 1.949, 2.052, 2.18, 2.308, 2.437,
] as const;

export const chiori: CharacterPreset = {
  id: "chiori",
  name: "千织",
  level: 90,
  baseHp: 11438,
  baseAtk: 323,
  baseDef: 953,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "geo",
  weaponType: "sword",
  defaultWeaponId: "cinnabar-spindle",
  burstEnergyCost: 50,
  panelEffects: [
    {
      id: "chiori-brocaded-collar",
      stage: "additive",
      conditional: true,
      evaluate: ({ damageSelections }) =>
        damageSelections.chioriGeoConstruct === "active"
          ? [{ stat: "elementalDmg", value: 20 }]
          : [],
    },
  ],
  constellations: [
    { level: 1, name: "正绢六通", description: "扩大袖的攻击范围并放宽额外袖的条件。" },
    { level: 2, name: "落染五色", description: "施放爆发后周期性召唤绢攻击。" },
    {
      level: 3,
      name: "缀锦四分",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 4, name: "衣裁三礼", description: "触发量体裁衣后追加绢攻击。" },
    {
      level: 5,
      name: "绫羽二重",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 6, name: "万理一空", description: "缩短战技冷却并按防御力强化普通攻击。" },
  ],
  damageProfile: {
    kind: "chiori",
    talentLabel: "羽袖一触",
    controls: [
      {
        key: "chioriGeoConstruct",
        label: "锦上添花",
        defaultValue: "active",
        options: [
          { value: "active", label: "已创造岩元素创造物 · 岩伤 +20%" },
          { value: "inactive", label: "未触发" },
        ],
      },
    ],
    evaluateTargets: ({ panel, settings, talentValue, percent }) => {
      const atkMultiplier = talentValue(
        tamotoAtkDamage,
        settings.skillTalentLevel,
      );
      const defMultiplier = talentValue(
        tamotoDefDamage,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "chiori-tamoto",
          name: "自动制御人形·袖单次攻击",
          description: "按攻击力与防御力双倍率计算的单次元素战技伤害。",
          multiplierLabel: `${percent(atkMultiplier)} 攻击力 + ${percent(defMultiplier)} 防御力`,
          baseDamage:
            panel.atk * atkMultiplier + panel.def * defMultiplier,
          category: "skill",
          reactions: ["none"],
        },
      ];
    },
  },
};
