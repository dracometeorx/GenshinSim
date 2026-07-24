import {
  calculateFinalPanel,
  type BuildInput,
  type FinalPanel,
} from "./calculator.ts";
import {
  calculateRepresentativeDamage,
  type DamageCalculationResult,
  type DamageSettings,
} from "./damage.ts";
import {
  clampConstellation,
  getConstellationCalculationState,
} from "./constellations.ts";
import { resolveArtifactModifiers } from "./data/artifacts/index.ts";
import type { ArtifactSetPreset } from "./data/artifacts/types.ts";
import type { CharacterPreset } from "./data/characters/types.ts";
import type { WeaponPreset } from "./data/weapons/types.ts";
import {
  resolveTeamBuffs,
  type TeamCalculationInput,
} from "./team.ts";
import type { ResolvedTeamBuff } from "./team-types.ts";

export type CalculationWarningCode =
  | "INCOMPATIBLE_BLIZZARD_MELT_CONDITION"
  | "CHARACTER_BUILD_NORMALIZED";

export interface CalculationWarning {
  code: CalculationWarningCode;
  message: string;
}

export interface CalculationRequest {
  build: BuildInput;
  character: CharacterPreset;
  weapon: WeaponPreset;
  artifactSet: ArtifactSetPreset;
  settings: DamageSettings;
  constellation?: number;
  team?: TeamCalculationInput;
}

export interface CalculationResult extends DamageCalculationResult {
  /** Current selected combat conditions; kept as the main display/export panel. */
  panel: FinalPanel;
  staticPanel: FinalPanel;
  combatPanel: FinalPanel;
  constellation: number;
  effectiveSettings: DamageSettings;
  teamBuffs: ResolvedTeamBuff[];
  warnings: CalculationWarning[];
}

/**
 * Unified public calculation entry point.
 *
 * The selected catalog character is authoritative. This prevents callers from
 * combining one character's damage profile with another character's base
 * panel, while keeping custom user-controlled build values intact.
 */
export function calculateBuild({
  build,
  character,
  weapon,
  artifactSet,
  settings,
  constellation: requestedConstellation = 0,
  team,
}: CalculationRequest): CalculationResult {
  const warnings: CalculationWarning[] = [];
  const characterMismatch =
    build.character.name !== character.name ||
    build.character.level !== character.level ||
    build.character.baseHp !== character.baseHp ||
    build.character.baseAtk !== character.baseAtk ||
    build.character.baseDef !== character.baseDef ||
    build.character.ascensionStat !== character.ascensionStat ||
    build.character.ascensionValue !== character.ascensionValue;
  const elementMismatch =
    character.id !== "custom" && build.element !== character.element;
  const resolvedCharacter =
    character.id === "custom" ? build.character : character;
  const resolvedWeapon: BuildInput["weapon"] =
    weapon.id === "custom"
      ? build.weapon
      : {
          ...weapon,
          level: build.weapon.level,
          refinement: Math.min(
            5,
            Math.max(1, Math.round(build.weapon.refinement)),
          ),
        };
  const normalizedBuild: BuildInput = {
    ...build,
    character: resolvedCharacter,
    weapon: resolvedWeapon,
    element:
      character.id === "custom" ? build.element : character.element,
    artifactSetId: artifactSet.id,
  };
  const constellation = clampConstellation(
    requestedConstellation,
  );
  const constellationState = getConstellationCalculationState(
    character,
    constellation,
    settings,
  );
  const effectiveSettings = constellationState.settings;

  if (characterMismatch || elementMismatch) {
    warnings.push({
      code: "CHARACTER_BUILD_NORMALIZED",
      message: "角色目录与方案基础属性不一致，已使用当前角色目录数据计算。",
    });
  }

  const panelEffects = [
    ...(weapon.passive.panelEffects ?? []),
    ...(character.panelEffects ?? []),
    ...constellationState.panelEffects,
  ];
  const staticArtifactModifiers = resolveArtifactModifiers(
    artifactSet,
    normalizedBuild.artifactSetPieces,
    normalizedBuild.artifactSetSelections,
    false,
  );
  const combatArtifactModifiers = resolveArtifactModifiers(
    artifactSet,
    normalizedBuild.artifactSetPieces,
    normalizedBuild.artifactSetSelections,
    true,
  );
  const staticPanel = calculateFinalPanel(normalizedBuild, {
    artifactModifiers: staticArtifactModifiers,
    panelEffects,
    damageSettings: effectiveSettings,
    includeConditionalEffects: false,
  });
  const standaloneCombatPanel = calculateFinalPanel(normalizedBuild, {
    artifactModifiers: combatArtifactModifiers,
    panelEffects,
    damageSettings: effectiveSettings,
    includeConditionalEffects: true,
  });
  const resolvedTeam = resolveTeamBuffs({
    target: {
      build: normalizedBuild,
      character,
      weapon: {
        ...weapon,
        refinement: normalizedBuild.weapon.refinement,
      },
      artifactSet,
    },
    targetConstellation: constellation,
    targetPanel: standaloneCombatPanel,
    settings: effectiveSettings,
    team,
  });
  const combatPanel = calculateFinalPanel(normalizedBuild, {
    artifactModifiers: combatArtifactModifiers,
    panelEffects: [...panelEffects, ...resolvedTeam.panelEffects],
    damageSettings: effectiveSettings,
    includeConditionalEffects: true,
  });
  const damage = calculateRepresentativeDamage(
    character,
    normalizedBuild,
    combatPanel,
    effectiveSettings,
    combatArtifactModifiers,
    [
      ...(weapon.passive.damageEffects ?? []),
      ...constellationState.damageEffects,
      ...resolvedTeam.damageEffects,
    ],
    constellation,
  );

  const hasMeltVariant = damage.skills.some((skill) =>
    skill.variants.some((variant) => variant.reaction === "melt"),
  );
  const blizzardState =
    normalizedBuild.artifactSetSelections?.blizzardEnemyState;
  if (
    artifactSet.id === "blizzard-strayer" &&
    normalizedBuild.artifactSetPieces === 4 &&
    hasMeltVariant &&
    (blizzardState === "cryo" || blizzardState === "frozen")
  ) {
    warnings.push({
      code: "INCOMPATIBLE_BLIZZARD_MELT_CONDITION",
      message:
        "融化需要火元素附着，不能同时享受冰影响或冻结条件暴击率；融化期望值已自动排除该加成。",
    });
  }

  return {
    ...damage,
    panel: combatPanel,
    staticPanel,
    combatPanel,
    constellation,
    effectiveSettings,
    teamBuffs: resolvedTeam.buffs,
    warnings,
  };
}
