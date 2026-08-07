import type { CharacterPreset } from "./types.ts";

const sunfellSliceDamage = [
  4.448, 4.782, 5.115, 5.56, 5.894, 6.227, 6.672,
  7.117, 7.562, 8.006, 8.451, 8.896, 9.452,
] as const;
const sunfellPerFightingSpirit = [
  0.016, 0.017, 0.018, 0.02, 0.021, 0.022, 0.024,
  0.026, 0.027, 0.029, 0.03, 0.032, 0.034,
] as const;

function selectedFightingSpirit(selections: Readonly<Record<string, string>>) {
  const value = Number(selections.mavuikaFightingSpirit ?? "200");
  return Math.min(200, Math.max(0, Math.round(value) || 0));
}

export const mavuika: CharacterPreset = {
  id: "mavuika",
  name: "玛薇卡",
  level: 90,
  baseHp: 12552,
  baseAtk: 359,
  baseDef: 792,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "pyro",
  weaponType: "claymore",
  defaultWeaponId: "a-thousand-blazing-suns",
  burstEnergyCost: 0,
  panelEffects: [
    {
      id: "mavuika-gift-of-flaming-flowers",
      stage: "additive",
      conditional: true,
      evaluate: ({ damageSelections }) =>
        damageSelections.mavuikaNightsoulBurst === "active"
          ? [{ stat: "atkPct", value: 30 }]
          : [],
    },
  ],
  teamBuffs: [
    {
      id: "mavuika-kiangozi",
      name: "基扬戈兹",
      description:
        "施放爆发后按战意提高当前场上角色造成的伤害，200 战意时为 40%；C4 额外提高 10%。",
      appliesToSelf: false,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "damageBonus",
          value:
            Math.min(
              40,
              selectedFightingSpirit(source.settings.selections) * 0.2,
            ) + (source.constellation >= 4 ? 10 : 0),
        },
      ],
    },
  ],
  constellations: [
    { level: 1, name: "夜主的授记", description: "提高夜魂值上限与战意获取效率。" },
    {
      level: 2,
      name: "灰烬的代价",
      description: "夜魂加持下提高基础攻击力，并强化诸火武装伤害。",
    },
    {
      level: 3,
      name: "燃烧的太阳",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 4,
      name: "领袖的觉悟",
      description: "基扬戈兹不再衰减，并额外提供 10% 伤害加成。",
    },
    {
      level: 5,
      name: "真实的含义",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 6, name: "人之名解放", description: "完全强化诸火武装。" },
  ],
  damageProfile: {
    kind: "mavuika",
    talentLabel: "燔天之时",
    controls: [
      {
        key: "mavuikaFightingSpirit",
        label: "施放爆发时的战意",
        defaultValue: "200",
        options: [0, 50, 100, 150, 200].map((value) => ({
          value: String(value),
          label: `${value} 点`,
        })),
      },
      {
        key: "mavuikaNightsoulBurst",
        label: "炎花献礼",
        defaultValue: "active",
        options: [
          { value: "active", label: "已触发夜魂迸发 · 攻击 +30%" },
          { value: "inactive", label: "未触发" },
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
      constellation,
    }) => {
      const burst = talentValue(
        sunfellSliceDamage,
        settings.burstTalentLevel,
      );
      const perSpirit = talentValue(
        sunfellPerFightingSpirit,
        settings.burstTalentLevel,
      );
      const fightingSpirit = clamp(
        Number(selection("mavuikaFightingSpirit")),
        0,
        200,
      );
      const c2Bonus = constellation >= 2 ? 1.2 : 0;
      const combinedMultiplier =
        burst + perSpirit * fightingSpirit + c2Bonus;
      return [
        {
          id: "mavuika-sunfell-slice",
          name: "坠日斩",
          description: `按 ${fightingSpirit} 点战意计算${constellation >= 2 ? "，并计入 C2 的 120% 攻击力提升" : ""}。`,
          multiplierLabel: `${percent(burst)} + ${fightingSpirit} × ${percent(perSpirit)}${c2Bonus ? " + 120%" : ""} 攻击力`,
          baseDamage: panel.atk * combinedMultiplier,
          category: "burst",
          reactions: ["none", "vaporize", "melt"],
        },
      ];
    },
  },
};
