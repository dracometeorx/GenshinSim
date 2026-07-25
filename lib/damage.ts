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
  DamageVariantKey,
  LunarReactionType,
  StellarReactionType,
} from "./damage-types.ts";
import {
  evaluateDamageEffects,
  getRefinementIndex,
  type DamageEffect,
} from "./effects.ts";

export type { DamageSettings } from "./damage-types.ts";

export interface DamageVariantResult {
  reaction: DamageVariantKey;
  label: string;
  nonCrit: number;
  crit: number;
  expected: number;
  model: "standard" | "directLunar" | "directStellar";
  defenseMultiplier: number;
  resistanceMultiplier: number;
  damageBonus: number;
  elementalMasteryBonus?: number;
  lunarBaseDamageBonus?: number;
  lunarReactionDamageBonus?: number;
  lunarElevation?: number;
  stellarElementalPower?: number;
  stellarReactionCoefficient?: number;
  stellarBaseDamageBonus?: number;
  stellarReactionDamageBonus?: number;
  stellarElevation?: number;
}

export interface RepresentativeDamageResult {
  id: string;
  name: string;
  description: string;
  multiplierLabel: string;
  model: "standard" | "directLunar" | "directStellar";
  /** 此技能伤害结算抗性时使用的元素；未显式声明时等于角色自身元素 */
  damageElement: BuildInput["element"];
  lunarReaction?: LunarReactionType;
  stellarReaction?: StellarReactionType;
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
    stellarElementalPower: "12",
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
  defenseReductionPercent = 0,
  defenseIgnorePercent = 0,
) {
  const attacker = clamp(characterLevel, 1, 200) + 100;
  const defender =
    (clamp(enemyLevel, 1, 200) + 100) *
    (1 - clamp(defenseReductionPercent, 0, 100) / 100) *
    (1 - clamp(defenseIgnorePercent, 0, 100) / 100);
  return attacker / (attacker + defender);
}

export function calculateResistanceMultiplier(resistancePercent: number) {
  const resistance = clamp(resistancePercent, -100, 1000) / 100;
  if (resistance < 0) return 1 - resistance / 2;
  if (resistance < 0.75) return 1 - resistance;
  return 1 / (4 * resistance + 1);
}

/** 圣遗物提供的、针对特定元素的抗性削减合计 */
function artifactResistanceReductionFor(
  artifactModifiers: readonly ArtifactModifier[],
  element: BuildInput["element"],
): number {
  return artifactModifiers.reduce(
    (total, modifier) =>
      modifier.kind === "enemyResistanceReduction" &&
      modifier.element === element
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
}

/** 伤害效果（命座、武器、队伍buff）提供的、针对特定元素的抗性削减合计 */
function effectResistanceReductionFor(
  modifiers: ReturnType<typeof evaluateDamageEffects>,
  element: BuildInput["element"],
): number {
  return modifiers.reduce(
    (total, modifier) =>
      modifier.stat === "enemyResistanceReduction" &&
      (!modifier.element || modifier.element === element)
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
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

export function lunarReactionLabel(reaction: LunarReactionType) {
  switch (reaction) {
    case "lunarCharged":
      return "直伤月感电";
    case "lunarBloom":
      return "直伤月绽放";
    case "lunarCrystallize":
      return "直伤月结晶";
  }
}

export function calculateLunarMasteryBonus(elementalMastery: number) {
  const mastery = Math.max(0, elementalMastery);
  return (600 * mastery) / (mastery + 2000);
}

export function stellarReactionLabel(
  reaction: StellarReactionType,
) {
  switch (reaction) {
    case "stellarConduct":
      return "直伤星电导";
  }
}

export function getStellarReactionCoefficient(
  elementalPower: number,
) {
  const power = clamp(Math.round(elementalPower), 0, 12);
  return power === 0 ? 1 : 1.4 + power * 0.05;
}

export function getPolestarElementalDamageBonus(
  elementalPower: number,
) {
  const power = clamp(Math.round(elementalPower), 0, 12);
  return power === 0 ? 20 : 28 + power;
}

function roundDamage(value: number) {
  return Math.max(0, Math.round(value));
}

function buildTargets(
  character: CharacterPreset,
  build: BuildInput,
  panel: FinalPanel,
  settings: DamageSettings,
  constellation: number,
  moonsignLevel: "none" | "nascent" | "ascendant",
  hexereiSecretRite: boolean,
  stellarConductActive: boolean,
  stellarElementalPower: number,
): DamageTarget[] {
  const profile = character.damageProfile;
  if (!profile) return [];

  return profile.evaluateTargets({
    build,
    constellation,
    moonsignLevel,
    hexereiSecretRite,
    stellarConductActive,
    stellarElementalPower,
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
 * 调用方可通过 damageEffects 传入命座、队友增益与敌人减防/减抗。
 */
export function calculateRepresentativeDamage(
  character: CharacterPreset,
  build: BuildInput,
  panel: FinalPanel,
  settings: DamageSettings,
  artifactModifiers: readonly ArtifactModifier[] = [],
  damageEffects: readonly DamageEffect[] = [],
  constellation = 0,
  moonsignLevel: "none" | "nascent" | "ascendant" = "none",
  hexereiSecretRite = false,
  stellarConductActive = false,
  stellarElementalPower = 0,
): DamageCalculationResult {
  const targets = buildTargets(
    character,
    build,
    panel,
    settings,
    constellation,
    moonsignLevel,
    hexereiSecretRite,
    stellarConductActive,
    stellarElementalPower,
  );

  // 收集所有目标涉及的伤害元素，按元素预计算圣遗物抗性削减
  const damageElements = new Set<BuildInput["element"]>();
  for (const target of targets) {
    damageElements.add(target.damageElement ?? build.element);
  }
  const artifactResistanceByElement = new Map(
    [...damageElements].map((el) => [
      el,
      artifactResistanceReductionFor(artifactModifiers, el),
    ]),
  );

  const targetsWithModifiers = targets.map((target) => ({
    target,
    modifiers: evaluateDamageEffects(
      damageEffects,
      {
        build,
        panel,
        target,
        settings,
        refinementIndex: getRefinementIndex(
          build.weapon.refinement,
        ),
        weaponSelections: build.weaponPassiveSelections ?? {},
      },
    ),
  }));

  // 概览级防御/抗性（使用第一个目标的伤害元素，仅用于摘要展示）
  const firstTarget = targets[0];
  const firstElement = firstTarget?.damageElement ?? build.element;
  const firstTargetModifiers =
    targetsWithModifiers[0]?.modifiers.filter(
      (modifier) =>
        !modifier.reactions?.length &&
        !modifier.lunarReactions?.length &&
        !modifier.stellarReactions?.length,
    ) ?? [];
  const defenseReduction = firstTargetModifiers.reduce(
    (total, modifier) =>
      modifier.stat === "enemyDefenseReduction"
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
  const defenseIgnore = firstTargetModifiers.reduce(
    (total, modifier) =>
      modifier.stat === "enemyDefenseIgnore"
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
  const defenseMultiplier = calculateDefenseMultiplier(
    build.character.level,
    settings.enemyLevel,
    defenseReduction,
    defenseIgnore,
  );
  const commonResistanceReduction = effectResistanceReductionFor(
    firstTargetModifiers,
    firstElement,
  );
  const effectiveResistance =
    settings.enemyResistance -
    (artifactResistanceByElement.get(firstElement) ?? 0) -
    commonResistanceReduction;
  const resistanceMultiplier = calculateResistanceMultiplier(
    effectiveResistance,
  );

  const skills = targetsWithModifiers.map(
    ({ target, modifiers: targetModifiers }) => {
      const targetElement = target.damageElement ?? build.element;
      const artifactDamageBonus = artifactModifiers.reduce(
        (total, modifier) => {
          if (modifier.kind !== "damageBonus") return total;
          if (
            modifier.element &&
            modifier.element !== targetElement
          ) {
            return total;
          }
          if (
            modifier.category &&
            modifier.category !== target.category
          ) {
            return total;
          }
          return total + Math.max(0, modifier.value);
        },
        0,
      );

      return {
        id: target.id,
        name: target.name,
        description: target.description,
        multiplierLabel: target.multiplierLabel,
        model: target.model?.kind ?? "standard",
        damageElement: targetElement,
        lunarReaction:
          target.model?.kind === "directLunar"
            ? target.model.reaction
            : undefined,
        stellarReaction:
          target.model?.kind === "directStellar"
            ? target.model.reaction
            : undefined,
        variants:
          target.model?.kind === "directLunar"
            ? [
                calculateDirectLunarVariant({
                  target: target as DamageTarget & {
                    model: Extract<
                      NonNullable<DamageTarget["model"]>,
                      { kind: "directLunar" }
                    >;
                  },
                  targetModifiers,
                  artifactModifiers,
                  artifactResistanceByElement,
                  build,
                  panel,
                  settings,
                }),
              ]
            : target.model?.kind === "directStellar"
              ? [
                  calculateDirectStellarVariant({
                    target: target as DamageTarget & {
                      model: Extract<
                        NonNullable<DamageTarget["model"]>,
                        { kind: "directStellar" }
                      >;
                    },
                    targetModifiers,
                    artifactModifiers,
                    artifactResistanceByElement,
                    build,
                    panel,
                    settings,
                    stellarElementalPower,
                  }),
                ]
            : target.reactions.map((reaction) => {
          const modifiers = targetModifiers.filter(
            (modifier) =>
              !modifier.lunarReactions?.length &&
              !modifier.stellarReactions?.length &&
              (!modifier.reactions?.length ||
                modifier.reactions.includes(reaction)),
          );
          const effectDamageBonus = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "damageBonus"
                ? total + modifier.value
                : total,
            0,
          );
          const damageBonus =
            panel.elementalDmg +
            panel.talentBonuses[target.category] +
            artifactDamageBonus +
            effectDamageBonus +
            (target.extraDamageBonus ?? 0);
          const effectCritRate = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "critRate"
                ? total + Math.max(0, modifier.value)
                : total,
            0,
          );
          const effectCritDmg = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "critDmg"
                ? total + Math.max(0, modifier.value)
                : total,
            0,
          );
          const baseCritRate = clamp(
            panel.critRate +
              effectCritRate +
              (target.extraCritRate ?? 0),
            0,
            100,
          );
          const critDmg = Math.max(
            0,
            panel.critDmg +
              effectCritDmg +
              (target.extraCritDmg ?? 0),
          );
          let baseDamage = target.baseDamage;
          let reactionMultiplier = 1;
          const additiveBaseDamage = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "additiveBaseDamage"
                ? total + modifier.value
                : total,
            0,
          );
          baseDamage += additiveBaseDamage;
          const baseDamageMultiplier = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "baseDamageMultiplier"
                ? total + Math.max(0, modifier.value)
                : total,
            0,
          );
          baseDamage *= 1 + baseDamageMultiplier / 100;
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
          const variantDefenseReduction = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "enemyDefenseReduction"
                ? total + Math.max(0, modifier.value)
                : total,
            0,
          );
          const variantDefenseIgnore = modifiers.reduce(
            (total, modifier) =>
              modifier.stat === "enemyDefenseIgnore"
                ? total + Math.max(0, modifier.value)
                : total,
            0,
          );
          const variantDefenseMultiplier = calculateDefenseMultiplier(
            build.character.level,
            settings.enemyLevel,
            variantDefenseReduction,
            variantDefenseIgnore,
          );
          const variantResistanceReduction = effectResistanceReductionFor(
            modifiers,
            targetElement,
          );
          const variantResistanceMultiplier =
            calculateResistanceMultiplier(
              settings.enemyResistance -
                (artifactResistanceByElement.get(targetElement) ?? 0) -
                variantResistanceReduction,
            );
          if (reaction === "vaporize" || reaction === "melt") {
            const reactionBonus = artifactModifiers.reduce(
              (total, modifier) => {
                if (modifier.kind !== "reactionBonus") return total;
                if (!modifier.reactions.includes(reaction)) return total;
                return total + Math.max(0, modifier.value) / 100;
              },
              0,
            ) + modifiers.reduce(
              (total, modifier) =>
                modifier.stat === "amplifyingReactionBonus"
                  ? total + Math.max(0, modifier.value) / 100
                  : total,
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
            variantDefenseMultiplier *
            variantResistanceMultiplier;
          return {
            reaction,
            label: reactionLabel(reaction),
            nonCrit: roundDamage(nonCrit),
            crit: roundDamage(nonCrit * (1 + critDmg / 100)),
            expected: roundDamage(
              nonCrit * (1 + (critRate / 100) * (critDmg / 100)),
            ),
            model: "standard" as const,
            defenseMultiplier: variantDefenseMultiplier,
            resistanceMultiplier: variantResistanceMultiplier,
            damageBonus,
          };
        }),
      };
    },
  );

  return {
    skills,
    defenseMultiplier,
    resistanceMultiplier,
    effectiveResistance,
  };
}

function calculateDirectLunarVariant({
  target,
  targetModifiers,
  artifactModifiers,
  artifactResistanceByElement,
  build,
  panel,
  settings,
}: {
  target: DamageTarget & {
    model: Extract<
      NonNullable<DamageTarget["model"]>,
      { kind: "directLunar" }
    >;
  };
  targetModifiers: ReturnType<typeof evaluateDamageEffects>;
  artifactModifiers: readonly ArtifactModifier[];
  artifactResistanceByElement: Map<BuildInput["element"], number>;
  build: BuildInput;
  panel: FinalPanel;
  settings: DamageSettings;
}): DamageVariantResult {
  const lunarReaction = target.model.reaction;
  const damageElement = target.damageElement ?? build.element;
  const modifiers = targetModifiers.filter(
    (modifier) =>
      !modifier.reactions?.length &&
      (!modifier.lunarReactions?.length ||
        modifier.lunarReactions.includes(lunarReaction)),
  );
  const sumModifier = (
    stat:
      | "critRate"
      | "critDmg"
      | "lunarBaseDamageBonus"
      | "lunarReactionDamageBonus"
      | "lunarAdditiveBaseDamage"
      | "lunarElevation"
      | "enemyResistanceReduction",
  ) =>
    modifiers.reduce(
      (total, modifier) =>
        modifier.stat === stat &&
        (stat !== "enemyResistanceReduction" ||
          !modifier.element ||
          modifier.element === damageElement)
          ? total + Math.max(0, modifier.value)
          : total,
      0,
    );
  const artifactLunarBonus = artifactModifiers.reduce(
    (total, modifier) =>
      modifier.kind === "lunarDamageBonus" &&
      (!modifier.lunarReactions?.length ||
        modifier.lunarReactions.includes(lunarReaction))
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
  const critRate = clamp(
    panel.critRate +
      sumModifier("critRate") +
      (target.extraCritRate ?? 0),
    0,
    100,
  );
  const critDmg = Math.max(
    0,
    panel.critDmg +
      sumModifier("critDmg") +
      (target.extraCritDmg ?? 0),
  );
  const lunarBaseDamageBonus =
    sumModifier("lunarBaseDamageBonus") +
    (target.extraLunarBaseDamageBonus ?? 0);
  const lunarReactionDamageBonus =
    sumModifier("lunarReactionDamageBonus") +
    artifactLunarBonus +
    (target.extraLunarReactionDamageBonus ?? 0);
  const elementalMasteryBonus = calculateLunarMasteryBonus(
    panel.elementalMastery,
  );
  const lunarAdditiveBaseDamage =
    sumModifier("lunarAdditiveBaseDamage") +
    (target.extraLunarAdditiveBaseDamage ?? 0);
  const lunarElevation =
    sumModifier("lunarElevation") +
    (target.extraLunarElevation ?? 0);
  const resistanceReduction =
    (artifactResistanceByElement.get(damageElement) ?? 0) +
    sumModifier("enemyResistanceReduction");
  const variantResistanceMultiplier = calculateResistanceMultiplier(
    settings.enemyResistance - resistanceReduction,
  );
  const directMultiplier = Math.max(
    0,
    target.model.directMultiplier ??
      (lunarReaction === "lunarCrystallize" ? 1.6 : 3),
  );
  const reactionBase =
    target.baseDamage *
    directMultiplier *
    (1 + lunarBaseDamageBonus / 100) *
    (1 +
      elementalMasteryBonus / 100 +
      lunarReactionDamageBonus / 100);
  const nonCrit =
    (reactionBase + lunarAdditiveBaseDamage) *
    (1 + lunarElevation / 100) *
    variantResistanceMultiplier;

  return {
    reaction: lunarReaction,
    label: lunarReactionLabel(lunarReaction),
    nonCrit: roundDamage(nonCrit),
    crit: roundDamage(nonCrit * (1 + critDmg / 100)),
    expected: roundDamage(
      nonCrit * (1 + (critRate / 100) * (critDmg / 100)),
    ),
    model: "directLunar",
    defenseMultiplier: 1,
    resistanceMultiplier: variantResistanceMultiplier,
    damageBonus: lunarReactionDamageBonus,
    elementalMasteryBonus,
    lunarBaseDamageBonus,
    lunarReactionDamageBonus,
    lunarElevation,
  };
}

function calculateDirectStellarVariant({
  target,
  targetModifiers,
  artifactModifiers,
  artifactResistanceByElement,
  build,
  panel,
  settings,
  stellarElementalPower,
}: {
  target: DamageTarget & {
    model: Extract<
      NonNullable<DamageTarget["model"]>,
      { kind: "directStellar" }
    >;
  };
  targetModifiers: ReturnType<typeof evaluateDamageEffects>;
  artifactModifiers: readonly ArtifactModifier[];
  artifactResistanceByElement: Map<BuildInput["element"], number>;
  build: BuildInput;
  panel: FinalPanel;
  settings: DamageSettings;
  stellarElementalPower: number;
}): DamageVariantResult {
  const stellarReaction = target.model.reaction;
  const damageElement = target.damageElement ?? build.element;
  const modifiers = targetModifiers.filter(
    (modifier) =>
      !modifier.reactions?.length &&
      !modifier.lunarReactions?.length &&
      (!modifier.stellarReactions?.length ||
        modifier.stellarReactions.includes(stellarReaction)),
  );
  const sumModifier = (
    stat:
      | "critRate"
      | "critDmg"
      | "baseDamageMultiplier"
      | "stellarBaseDamageBonus"
      | "stellarReactionDamageBonus"
      | "stellarAdditiveBaseDamage"
      | "stellarElevation"
      | "enemyResistanceReduction",
  ) =>
    modifiers.reduce(
      (total, modifier) =>
        modifier.stat === stat &&
        (stat !== "enemyResistanceReduction" ||
          !modifier.element ||
          modifier.element === damageElement)
          ? total + Math.max(0, modifier.value)
          : total,
      0,
    );
  const artifactStellarBonus = artifactModifiers.reduce(
    (total, modifier) =>
      modifier.kind === "stellarDamageBonus" &&
      (!modifier.stellarReactions?.length ||
        modifier.stellarReactions.includes(stellarReaction))
        ? total + Math.max(0, modifier.value)
        : total,
    0,
  );
  const critRate = clamp(
    panel.critRate +
      sumModifier("critRate") +
      (target.extraCritRate ?? 0),
    0,
    100,
  );
  const critDmg = Math.max(
    0,
    panel.critDmg +
      sumModifier("critDmg") +
      (target.extraCritDmg ?? 0),
  );
  const stellarBaseDamageBonus =
    sumModifier("stellarBaseDamageBonus") +
    (target.extraStellarBaseDamageBonus ?? 0);
  const stellarReactionDamageBonus =
    sumModifier("stellarReactionDamageBonus") +
    artifactStellarBonus +
    (target.extraStellarReactionDamageBonus ?? 0);
  const elementalMasteryBonus = calculateLunarMasteryBonus(
    panel.elementalMastery,
  );
  const stellarAdditiveBaseDamage =
    sumModifier("stellarAdditiveBaseDamage") +
    (target.extraStellarAdditiveBaseDamage ?? 0);
  const stellarElevation =
    sumModifier("stellarElevation") +
    (target.extraStellarElevation ?? 0);
  const specialMultiplier =
    1 + sumModifier("baseDamageMultiplier") / 100;
  const resistanceReduction =
    (artifactResistanceByElement.get(damageElement) ?? 0) +
    sumModifier("enemyResistanceReduction");
  const variantResistanceMultiplier = calculateResistanceMultiplier(
    settings.enemyResistance - resistanceReduction,
  );
  const stellarReactionCoefficient =
    getStellarReactionCoefficient(stellarElementalPower);
  const reactionBase =
    target.baseDamage *
    stellarReactionCoefficient *
    specialMultiplier *
    (1 + stellarBaseDamageBonus / 100) *
    (1 +
      elementalMasteryBonus / 100 +
      stellarReactionDamageBonus / 100);
  const nonCrit =
    (reactionBase + stellarAdditiveBaseDamage) *
    (1 + stellarElevation / 100) *
    variantResistanceMultiplier;

  return {
    reaction: stellarReaction,
    label: stellarReactionLabel(stellarReaction),
    nonCrit: roundDamage(nonCrit),
    crit: roundDamage(nonCrit * (1 + critDmg / 100)),
    expected: roundDamage(
      nonCrit * (1 + (critRate / 100) * (critDmg / 100)),
    ),
    model: "directStellar",
    defenseMultiplier: 1,
    resistanceMultiplier: variantResistanceMultiplier,
    damageBonus: stellarReactionDamageBonus,
    elementalMasteryBonus,
    stellarElementalPower: clamp(
      Math.round(stellarElementalPower),
      0,
      12,
    ),
    stellarReactionCoefficient,
    stellarBaseDamageBonus,
    stellarReactionDamageBonus,
    stellarElevation,
  };
}
