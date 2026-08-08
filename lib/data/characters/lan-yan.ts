import type { CharacterPreset } from "./types.ts";

const feathermoonRingDamage = [
  0.963, 1.035, 1.107, 1.203, 1.275, 1.348, 1.444, 1.54,
  1.636, 1.733, 1.829, 1.925, 2.045,
] as const;

export const lanYan: CharacterPreset = {
  id: "lan-yan",
  name: "蓝砚",
  level: 90,
  baseHp: 9244,
  baseAtk: 251,
  baseDef: 580,
  ascensionStat: "atkPct",
  ascensionValue: 24,
  ascensionLabel: "攻击力 +24%",
  element: "anemo",
  weaponType: "catalyst",
  defaultWeaponId: "thrilling-tales",
  burstEnergyCost: 60,
  teamBuffs: [
    {
      id: "lan-yan-c4-party-mastery",
      name: "C4·揽龙鹰兮结血珠",
      description:
        "施放元素爆发后的 12 秒内，队伍中附近所有角色元素精通提高 60 点。",
      minConstellation: 4,
      contributesToBuffSourcePanel: true,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "panel",
          stat: "elementalMastery",
          value: 60,
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "若有人兮云之际",
      description:
        "元素战技触发护盾元素转化后，额外抛出一枚翦月环。",
    },
    {
      level: 2,
      name: "舞袂翩兮扬玉霓",
      description:
        "凤缕护盾存在期间，当前场上角色普通攻击可恢复护盾吸收量。",
    },
    {
      level: 3,
      name: "乘白凤兮翦雾縠",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "揽龙鹰兮结血珠",
      description: "施放元素爆发后，全队元素精通提高 60 点。",
    },
    {
      level: 5,
      name: "既见君兮予所欢",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "愿随风兮鸣银鸾",
      description: "元素战技的可使用次数增加 1 次。",
    },
  ],
  damageProfile: {
    kind: "lan-yan",
    talentLabel: "凤缕随翦舞",
    controls: [
      {
        key: "lanYanShieldConversion",
        label: "凤缕护盾元素转化",
        defaultValue: "active",
        options: [
          { value: "inactive", label: "未发生元素转化" },
          { value: "active", label: "已发生元素转化" },
        ],
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      selection,
      settings,
      talentValue,
      percent,
    }) => {
      const multiplier = talentValue(
        feathermoonRingDamage,
        settings.skillTalentLevel,
      );
      const ringCount =
        constellation >= 1 &&
        selection("lanYanShieldConversion") === "active"
          ? 2
          : 1;
      const ringBaseDamage =
        panel.atk * multiplier + panel.elementalMastery * 3.09;
      return [
        {
          id: "lan-yan-feathermoon-rings",
          name:
            ringCount === 2
              ? "凤缕随翦舞·双翦月环"
              : "凤缕随翦舞·翦月环",
          description:
            "计算翦月环风元素伤害与苍翎镇邪敕符的 309% 元素精通加算；不合并护盾转化附加的异色伤害。",
          multiplierLabel: `${ringCount} × (${percent(multiplier)} 攻击力 + 309% 元素精通)`,
          baseDamage: ringBaseDamage * ringCount,
          category: "skill",
          reactions: ["none"],
          segments:
            ringCount === 2
              ? [1, 2].map((index) => ({
                  id: `lan-yan-feathermoon-ring-${index}`,
                  name: `翦月环第 ${index} 枚`,
                  multiplierLabel: `${percent(multiplier)} 攻击力 + 309% 元素精通`,
                  baseDamage: ringBaseDamage,
                }))
              : undefined,
        },
      ];
    },
  },
};
