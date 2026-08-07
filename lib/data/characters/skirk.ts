import type { CharacterPreset } from "./types.ts";

const burstSlashDamage = [
  1.228, 1.32, 1.412, 1.534, 1.627, 1.719, 1.841,
  1.964, 2.087, 2.21, 2.332, 2.455, 2.609, 2.762, 2.916,
] as const;
const burstFinalDamage = [
  2.046, 2.199, 2.353, 2.558, 2.711, 2.864, 3.069,
  3.274, 3.478, 3.683, 3.887, 4.092, 4.348, 4.604, 4.859,
] as const;
const guileDamagePerPoint = [
  0.1932, 0.2077, 0.2222, 0.2415, 0.256, 0.2705, 0.2898,
  0.3092, 0.3285, 0.3478, 0.3671, 0.3865, 0.4106, 0.4348,
  0.4589,
] as const;
const riftDamageBonuses = [
  [3.5, 6.6, 8.8, 11],
  [4, 7.2, 9.6, 12],
  [4.5, 7.8, 10.4, 13],
  [5, 8.4, 11.2, 14],
  [5.5, 9, 12, 15],
  [6, 9.6, 12.8, 16],
  [6.5, 10.2, 13.6, 17],
  [7, 10.8, 14.4, 18],
  [7.5, 11.4, 15.2, 19],
  [8, 12, 16, 20],
  [8.5, 12.6, 16.8, 21],
  [9, 13.2, 17.6, 22],
  [9.5, 13.8, 18.4, 23],
  [10, 14.4, 19.2, 24],
  [10.5, 15, 20, 25],
] as const;

export const skirk: CharacterPreset = {
  id: "skirk",
  name: "丝柯克",
  level: 90,
  baseHp: 12417,
  baseAtk: 359,
  baseDef: 806,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "cryo",
  weaponType: "sword",
  defaultWeaponId: "azurelight",
  burstEnergyCost: 0,
  constellations: [
    { level: 1, name: "湮远", description: "汲取虚境裂隙时追加晶刃攻击。" },
    {
      level: 2,
      name: "坠渊",
      description: "元素战技额外获得蛇之狡谋，爆发至多额外计入 10 点。",
    },
    {
      level: 3,
      name: "罪缘",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    { level: 4, name: "流断", description: "死河渡断额外提高攻击力。" },
    {
      level: 5,
      name: "结愿",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    { level: 6, name: "至源", description: "汲取虚境裂隙后获得协同攻击层数。" },
  ],
  damageProfile: {
    kind: "skirk",
    talentLabel: "极恶技·灭",
    controls: [
      {
        key: "skirkSerpentsSubtlety",
        label: "蛇之狡谋",
        defaultValue: "100",
        options: [50, 60, 75, 100].map((value) => ({
          value: String(value),
          label: `${value} 点`,
        })),
      },
      {
        key: "skirkVoidRifts",
        label: "汲取虚境裂隙",
        defaultValue: "3",
        options: [0, 1, 2, 3].map((value) => ({
          value: String(value),
          label: `${value} 枚`,
        })),
      },
      {
        key: "skirkDeadRiverStacks",
        label: "死河渡断",
        defaultValue: "3",
        options: [0, 1, 2, 3].map((value) => ({
          value: String(value),
          label: `${value} 层`,
        })),
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
      const slash = talentValue(
        burstSlashDamage,
        settings.burstTalentLevel,
      );
      const finalSlash = talentValue(
        burstFinalDamage,
        settings.burstTalentLevel,
      );
      const guilePerPoint = talentValue(
        guileDamagePerPoint,
        settings.burstTalentLevel,
      );
      const selectedGuile = clamp(
        Number(selection("skirkSerpentsSubtlety")),
        50,
        100,
      );
      const effectiveGuile = selectedGuile + (constellation >= 2 ? 10 : 0);
      const rifts = clamp(
        Number(selection("skirkVoidRifts")),
        0,
        3,
      );
      const deadRiverStacks = clamp(
        Number(selection("skirkDeadRiverStacks")),
        0,
        3,
      );
      const talentIndex = Math.min(
        riftDamageBonuses.length - 1,
        Math.max(0, Math.round(settings.burstTalentLevel) - 1),
      );
      const riftBonus =
        riftDamageBonuses[talentIndex]?.[rifts] ?? 0;
      const deadRiverMultiplier = [1, 1.05, 1.15, 1.6][deadRiverStacks] ?? 1;
      const baseMultiplier =
        (slash * 5 + finalSlash + guilePerPoint * effectiveGuile) *
        deadRiverMultiplier;
      return [
        {
          id: "skirk-burst",
          name: "极恶技·灭（六段合计）",
          description: `按 ${effectiveGuile} 点有效蛇之狡谋、${rifts} 枚虚境裂隙与 ${deadRiverStacks} 层死河渡断计算。`,
          multiplierLabel: `(5 × ${percent(slash)} + ${percent(finalSlash)} + ${effectiveGuile} × ${percent(guilePerPoint)}) × ${deadRiverMultiplier.toFixed(2)}`,
          baseDamage: panel.atk * baseMultiplier,
          category: "burst",
          reactions: ["none", "melt"],
          extraDamageBonus: riftBonus,
        },
      ];
    },
  },
};
