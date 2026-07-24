import type { CharacterPreset } from "./types.ts";

const burstMultipliers = [
  4.008, 4.3086, 4.6092, 5.01, 5.3106, 5.6112, 6.012, 6.4128,
  6.8136, 7.2144, 7.6152, 8.016, 8.52702,
] as const;
const resolvePerStackMultipliers = [
  0.03888, 0.041796, 0.044712, 0.0486, 0.051516, 0.054432, 0.05832,
  0.062208, 0.066096, 0.069984, 0.073872, 0.07776, 0.08262,
] as const;
const eyeBurstBonusPerEnergy = [
  0.0022, 0.0023, 0.0024, 0.0025, 0.0026, 0.0027, 0.0028, 0.0029,
  0.003, 0.003,
] as const;
const burstEnergyCost = 90;

export const raiden: CharacterPreset = {
  id: "raiden",
  name: "雷电将军",
  level: 90,
  baseHp: 12907,
  baseAtk: 337,
  baseDef: 789,
  ascensionStat: "energyRecharge",
  ascensionValue: 32,
  ascensionLabel: "元素充能效率 +32%",
  element: "electro",
  weaponType: "polearm",
  defaultWeaponId: "engulfing",
  burstEnergyCost: 90,
  panelEffects: [
    {
      id: "raiden-enlightened-one",
      stage: "conversion",
      evaluate: ({ panel }) => [
        {
          stat: "elementalDmg",
          value: Math.max(0, panel.energyRecharge - 100) * 0.4,
        },
      ],
    },
  ],
  teamBuffs: [
    {
      id: "raiden-baleful-omen",
      name: "恶曜之眼",
      description:
        "按雷电将军元素战技等级和当前角色爆发能量，提高元素爆发伤害。",
      evaluate: ({ source, target }) => {
        const level = Math.min(
          13,
          Math.max(1, source.settings.skillTalentLevel),
        );
        const perEnergy =
          [0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29][
            level - 1
          ] ?? 0.3;
        return [
          {
            kind: "damage",
            stat: "damageBonus",
            category: "burst",
            value: perEnergy * target.burstEnergyCost,
          },
        ];
      },
    },
    {
      id: "raiden-c4-attack",
      name: "C4·誓奉常道",
      description:
        "梦想一心状态结束后，除雷电将军外的队友攻击力提高 30%。",
      minConstellation: 4,
      evaluate: () => [
        { kind: "panel", stat: "atkPct", value: 30 },
      ],
    },
  ],
  constellations: [
    {
      level: 2,
      name: "斩铁断金",
      description:
        "梦想一刀与梦想一心攻击无视敌人 60% 防御力。",
      damageEffects: [
        {
          id: "raiden-c2-defense-ignore",
          evaluate: ({ target }) =>
            target.category === "burst"
              ? [
                  {
                    stat: "enemyDefenseIgnore",
                    value: 60,
                  },
                ]
              : [],
        },
      ],
    },
    {
      level: 3,
      name: "真影旧事",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "誓奉常道",
      description:
        "梦想一心状态结束后，队友攻击力提高 30%。",
    },
  ],
  damageProfile: {
    kind: "raiden",
    talentLabel: "战技 / 爆发等级",
    controls: [
      {
        key: "raidenResolveStacks",
        label: "愿力层数",
        defaultValue: "60",
        options: [0, 10, 20, 30, 40, 50, 60].map((value) => ({
          value: String(value),
          label: `${value} 层`,
        })),
      },
      {
        key: "raidenEyeState",
        label: "恶曜之眼",
        defaultValue: "active",
        options: [
          { value: "active", label: "已开启" },
          { value: "inactive", label: "未开启" },
        ],
      },
    ],
    evaluateTargets: ({
      panel,
      settings,
      selection,
      talentValue,
      clamp,
      percent,
    }) => {
      const burst = talentValue(
        burstMultipliers,
        settings.burstTalentLevel,
      );
      const resolvePerStack = talentValue(
        resolvePerStackMultipliers,
        settings.burstTalentLevel,
      );
      const resolveStacks = clamp(
        Number(selection("raidenResolveStacks")),
        0,
        60,
      );
      const eyeActive = selection("raidenEyeState") === "active";
      const eyeBonus = eyeActive
        ? talentValue(
            eyeBurstBonusPerEnergy,
            settings.skillTalentLevel,
          ) *
          burstEnergyCost *
          100
        : 0;
      const combinedMultiplier =
        burst + resolvePerStack * resolveStacks;
      return [
        {
          id: "raiden-burst",
          name: "梦想一刀",
          description: `按 ${resolveStacks} 层愿力计算；已计入超出 100% 充能转雷伤${eyeActive ? "与恶曜之眼爆发增伤" : ""}。`,
          multiplierLabel: `${percent(burst)} + ${resolveStacks} × ${percent(resolvePerStack)}`,
          baseDamage: panel.atk * combinedMultiplier,
          category: "burst",
          reactions: ["none"],
          extraDamageBonus: eyeBonus,
        },
      ];
    },
  },
};
