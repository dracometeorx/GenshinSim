import type { BuildInput, FinalPanel } from "./calculator.ts";
import type {
  CharacterDamageProfile,
  CharacterPreset,
} from "./data/characters/types.ts";
import type { ArtifactModifier } from "./data/artifacts/types.ts";
import type {
  DamageReaction,
  DamageSettings,
  DamageTarget,
} from "./damage-types.ts";

export type { DamageSettings } from "./damage-types.ts";

export interface DamageVariantResult {
  reaction: DamageReaction;
  label: string;
  nonCrit: number;
  crit: number;
  expected: number;
}

export interface RepresentativeDamageResult {
  id: string;
  name: string;
  description: string;
  multiplierLabel: string;
  variants: DamageVariantResult[];
}

export interface DamageCalculationResult {
  skills: RepresentativeDamageResult[];
  defenseMultiplier: number;
  resistanceMultiplier: number;
  effectiveResistance: number;
}

export const defaultDamageSettings: DamageSettings = {
  enemyLevel: 105,
  enemyResistance: 10,
  normalTalentLevel: 10,
  skillTalentLevel: 10,
  burstTalentLevel: 10,
  selections: {
    ayakaDashBonus: "active",
    hutaoHpState: "below50",
    raidenResolveStacks: "60",
    raidenEyeState: "active",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function talentValue(
  values: readonly number[],
  talentLevel: number,
) {
  const index = clamp(Math.round(talentLevel), 1, values.length) - 1;
  return values[index] ?? values[values.length - 1] ?? 0;
}

function percent(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits).replace(/\.?0+$/, "")}%`;
}

function getSelection(
  profile: CharacterDamageProfile,
  settings: DamageSettings,
  key: string,
) {
  const control = profile.controls.find((item) => item.key === key);
  return settings.selections[key] ?? control?.defaultValue ?? "";
}

export function getDamageSelectionsForCharacter(character: CharacterPreset) {
  return Object.fromEntries(
    (character.damageProfile?.controls ?? []).map((control) => [
      control.key,
      control.defaultValue,
    ]),
  );
}

export function calculateDefenseMultiplier(
  characterLevel: number,
  enemyLevel: number,
) {
  const attacker = clamp(characterLevel, 1, 200) + 100;
  const defender = clamp(enemyLevel, 1, 200) + 100;
  return attacker / (attacker + defender);
}

export function calculateResistanceMultiplier(resistancePercent: number) {
  const resistance = clamp(resistancePercent, -100, 1000) / 100;
  if (resistance < 0) return 1 - resistance / 2;
  if (resistance < 0.75) return 1 - resistance;
  return 1 / (4 * resistance + 1);
}

function amplifyingReactionMultiplier(
  reaction: "vaporize" | "melt",
  element: BuildInput["element"],
  elementalMastery: number,
  reactionBonus: number,
) {
  const base =
    reaction === "vaporize"
      ? element === "hydro"
        ? 2
        : 1.5
      : element === "pyro"
        ? 2
        : 1.5;
  const masteryBonus =
    (2.78 * Math.max(0, elementalMastery)) /
    (Math.max(0, elementalMastery) + 1400);
  return base * (1 + masteryBonus + reactionBonus);
}

const reactionLevelMultipliers = [
  17.165605, 18.535048, 19.904854, 21.274903, 22.6454, 24.649613,
  26.640643, 28.868587, 31.36768, 34.143343, 37.201, 40.66,
  44.446668, 48.563519, 53.74848, 59.081897, 64.420047, 69.724455,
  75.123137, 80.584775, 86.112028, 91.703742, 97.244628, 102.812644,
  108.409563, 113.201694, 118.102906, 122.979318, 129.72733, 136.29291,
  142.67085, 149.029029, 155.416987, 161.825495, 169.106313, 176.518077,
  184.072741, 191.709518, 199.556908, 207.382042, 215.3989, 224.165667,
  233.50216, 243.350573, 256.063067, 268.543493, 281.526075, 295.013648,
  309.067188, 323.601597, 336.757542, 350.530312, 364.482705, 378.619181,
  398.600417, 416.398254, 434.386996, 452.951051, 472.606217, 492.88489,
  513.568543, 539.103198, 565.510563, 592.538753, 624.443427, 651.470148,
  679.49683, 707.79406, 736.671422, 765.640231, 794.773403, 824.677397,
  851.157781, 877.74209, 914.229123, 946.746752, 979.411386, 1011.223022,
  1044.791746, 1077.443668, 1109.99754, 1142.976615, 1176.369483,
  1210.184393, 1253.835659, 1288.952801, 1325.484092, 1363.456928,
  1405.097377, 1446.853458,
] as const;

export function getReactionLevelMultiplier(characterLevel: number) {
  const level = clamp(
    Math.round(characterLevel),
    1,
    reactionLevelMultipliers.length,
  );
  return reactionLevelMultipliers[level - 1];
}

export function calculateSpreadBonus(
  elementalMastery: number,
  characterLevel: number,
) {
  const levelBase = getReactionLevelMultiplier(characterLevel);
  const masteryBonus =
    (5 * Math.max(0, elementalMastery)) /
    (Math.max(0, elementalMastery) + 1200);
  return 1.25 * levelBase * (1 + masteryBonus);
}

function reactionLabel(reaction: DamageReaction) {
  switch (reaction) {
    case "vaporize":
      return "蒸发";
    case "melt":
      return "融化";
    case "spread":
      return "蔓激化";
    default:
      return "不反应";
  }
}

function roundDamage(value: number) {
  return Math.max(0, Math.round(value));
}

function buildTargets(
  character: CharacterPreset,
  build: BuildInput,
  panel: FinalPanel,
  settings: DamageSettings,
): DamageTarget[] {
  const profile = character.damageProfile;
  if (!profile) return [];

  return profile.evaluateTargets({
    build,
    panel,
    settings,
    selection: (key) => getSelection(profile, settings, key),
    talentValue,
    clamp,
    percent,
  });
}

/**
 * 计算角色代表技能的单目标伤害。
 * 包含角色自身机制、当前武器/套装面板、分类增伤、双暴、敌人防御和抗性；
 * 不包含队友增益、命座、敌人防御降低或独立易伤。
 */
export function calculateRepresentativeDamage(
  character: CharacterPreset,
  build: BuildInput,
  panel: FinalPanel,
  settings: DamageSettings,
  artifactModifiers: readonly ArtifactModifier[] = [],
): DamageCalculationResult {
  const defenseMultiplier = calculateDefenseMultiplier(
    build.character.level,
    settings.enemyLevel,
  );
  const resistanceReduction = artifactModifiers.reduce(
    (total, modifier) =>
      modifier.kind === "enemyResistanceReduction" &&
      modifier.element === build.element
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
  const effectiveResistance =
    settings.enemyResistance - resistanceReduction;
  const resistanceMultiplier = calculateResistanceMultiplier(
    effectiveResistance,
  );

  const skills = buildTargets(
    character,
    build,
    panel,
    settings,
  ).map((target) => {
    const artifactDamageBonus = artifactModifiers.reduce(
      (total, modifier) => {
        if (modifier.kind !== "damageBonus") return total;
        if (modifier.element && modifier.element !== build.element) {
          return total;
        }
        if (modifier.category && modifier.category !== target.category) {
          return total;
        }
        return total + Math.max(0, modifier.value);
      },
      0,
    );
    const damageBonus =
      panel.elementalDmg +
      panel.talentBonuses[target.category] +
      artifactDamageBonus +
      (target.extraDamageBonus ?? 0);
    const baseCritRate = clamp(
      panel.critRate + (target.extraCritRate ?? 0),
      0,
      100,
    );
    const critDmg = Math.max(
      0,
      panel.critDmg + (target.extraCritDmg ?? 0),
    );

    return {
      id: target.id,
      name: target.name,
      description: target.description,
      multiplierLabel: target.multiplierLabel,
      variants: target.reactions.map((reaction) => {
        let baseDamage = target.baseDamage;
        let reactionMultiplier = 1;
        const incompatibleCritRate =
          reaction === "melt" &&
          build.artifactSetId === "blizzard-strayer" &&
          build.artifactSetPieces === 4
            ? artifactModifiers.reduce(
                (total, modifier) =>
                  modifier.kind === "stat" &&
                  modifier.stat === "critRate"
                    ? total + Math.max(0, modifier.value)
                    : total,
                0,
              )
            : 0;
        const critRate = clamp(
          baseCritRate - incompatibleCritRate,
          0,
          100,
        );
        if (reaction === "vaporize" || reaction === "melt") {
          const reactionBonus = artifactModifiers.reduce(
            (total, modifier) => {
              if (modifier.kind !== "reactionBonus") return total;
              if (!modifier.reactions.includes(reaction)) return total;
              return total + Math.max(0, modifier.value) / 100;
            },
            0,
          );
          reactionMultiplier = amplifyingReactionMultiplier(
            reaction,
            build.element,
            panel.elementalMastery,
            reactionBonus,
          );
        } else if (reaction === "spread") {
          baseDamage += calculateSpreadBonus(
            panel.elementalMastery,
            build.character.level,
          );
        }

        const nonCrit =
          baseDamage *
          reactionMultiplier *
          (1 + damageBonus / 100) *
          defenseMultiplier *
          resistanceMultiplier;
        return {
          reaction,
          label: reactionLabel(reaction),
          nonCrit: roundDamage(nonCrit),
          crit: roundDamage(nonCrit * (1 + critDmg / 100)),
          expected: roundDamage(
            nonCrit * (1 + (critRate / 100) * (critDmg / 100)),
          ),
        };
      }),
    };
  });

  return {
    skills,
    defenseMultiplier,
    resistanceMultiplier,
    effectiveResistance,
  };
}
